import { test as base, expect, type Locator, type Page } from '@playwright/test';
import type { Model, NgDiagramConfig, Point } from 'ng-diagram';
import type { DiagramHandle, HarnessBridge } from '../../harness/api';

declare global {
  interface Window extends HarnessBridge {}
}

/**
 * Mirror of an ng-diagram service that lives in the browser. Each callable
 * member (method or signal) becomes an async function that resolves to the
 * serialized return value. Non-callable members are hidden because they
 * can't safely cross the page boundary.
 */
export type Remote<T> = {
  [K in keyof T as T[K] extends (...args: never[]) => unknown ? K : never]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Promise<Awaited<R>>
    : never;
};

/**
 * Page object for the ng-diagram e2e harness.
 *
 *   - `diagram`, `model`, `nodes`, `selection`, `viewport`, `groups`,
 *     `clipboard` mirror the public ng-diagram services. Call them exactly
 *     as you would in Angular code — every call hops to the browser and
 *     resolves with the serialized return value (including signal reads).
 *   - Locators (`node`, `edge`, `port`, `allNodes`, `allEdges`, `container`)
 *     resolve elements rendered by ng-diagram and pair with web-first
 *     assertions (`toBeVisible`, `toHaveCount`, `toBeAttached`).
 *   - Gestures (`dragNode`, `linkPorts`, `panBy`, `clickCanvas`) wrap the
 *     pointer-down / intermediate-move / pointer-up dance.
 *   - `page` is exposed for the rare case a test needs raw Playwright access.
 */
export class Diagram {
  readonly diagram: Remote<DiagramHandle['diagram']>;
  readonly model: Remote<DiagramHandle['model']>;
  readonly nodes: Remote<DiagramHandle['nodes']>;
  readonly selection: Remote<DiagramHandle['selection']>;
  readonly viewport: Remote<DiagramHandle['viewport']>;
  readonly groups: Remote<DiagramHandle['groups']>;
  readonly clipboard: Remote<DiagramHandle['clipboard']>;

  constructor(readonly page: Page) {
    this.diagram = remoteService(page, 'diagram');
    this.model = remoteService(page, 'model');
    this.nodes = remoteService(page, 'nodes');
    this.selection = remoteService(page, 'selection');
    this.viewport = remoteService(page, 'viewport');
    this.groups = remoteService(page, 'groups');
    this.clipboard = remoteService(page, 'clipboard');
  }

  // ──────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ──────────────────────────────────────────────────────────────────────

  /**
   * Navigate to the harness. Optionally seed the model and/or config — both
   * land on `window` before bootstrap via `addInitScript`.
   */
  async load(options: { model?: Partial<Model>; config?: Partial<NgDiagramConfig> } = {}): Promise<void> {
    if (options.model !== undefined) {
      await this.page.addInitScript((m) => {
        window.__diagramSeed = m;
      }, options.model);
    }
    if (options.config !== undefined) {
      await this.page.addInitScript((c) => {
        window.__diagramConfig = c;
      }, options.config);
    }
    await this.page.goto('/');
    await this.page.waitForFunction(() => window.__diagramReady === true);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Locators
  // ──────────────────────────────────────────────────────────────────────

  get container(): Locator {
    return this.page.getByTestId('diagram-container');
  }

  /** All rendered nodes — matches the `data-node-id` attribute emitted by ng-diagram. */
  get allNodes(): Locator {
    return this.page.locator('[data-node-id]');
  }

  /** All rendered edges — matches the `data-edge-id` attribute emitted by ng-diagram. */
  get allEdges(): Locator {
    return this.page.locator('[data-edge-id]');
  }

  node(id: string): Locator {
    return this.page.locator(`[data-node-id="${cssEscape(id)}"]`);
  }

  edge(id: string): Locator {
    return this.page.locator(`[data-edge-id="${cssEscape(id)}"]`);
  }

  port(nodeId: string, portId: string): Locator {
    return this.node(nodeId).locator(`[data-port-id="${cssEscape(portId)}"]`);
  }

  // ──────────────────────────────────────────────────────────────────────
  // Gestures (DOM-level)
  // ──────────────────────────────────────────────────────────────────────

  /** Click an empty area of the canvas (bottom-right corner of the container). */
  async clickCanvas(): Promise<void> {
    const box = await requireBox(this.container, 'container');
    await this.page.mouse.click(box.x + box.width - 20, box.y + box.height - 20);
  }

  /** Drag a node by the given delta. */
  async dragNode(id: string, delta: Point): Promise<void> {
    const box = await requireBox(this.node(id), `node "${id}"`);
    const start = centerOf(box);
    await this.pointerDrag(start, { x: start.x + delta.x, y: start.y + delta.y });
  }

  /** Drag from one port to another to draw an edge. */
  async linkPorts(source: { node: string; port: string }, target: { node: string; port: string }): Promise<void> {
    const src = await requireBox(this.port(source.node, source.port), `port ${source.node}/${source.port}`);
    const dst = await requireBox(this.port(target.node, target.port), `port ${target.node}/${target.port}`);
    await this.pointerDrag(centerOf(src), centerOf(dst));
  }

  /** Pan the canvas from an empty corner by a delta. */
  async panBy(delta: Point): Promise<void> {
    const box = await requireBox(this.container, 'container');
    const start = { x: box.x + box.width - 30, y: box.y + box.height - 30 };
    await this.pointerDrag(start, { x: start.x + delta.x, y: start.y + delta.y });
  }

  /** Pointer drag with an intermediate move so the diagram registers a drag rather than a click. */
  private async pointerDrag(from: Point, to: Point): Promise<void> {
    const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down();
    await this.page.mouse.move(mid.x, mid.y, { steps: 6 });
    await this.page.mouse.move(to.x, to.y, { steps: 6 });
    await this.page.mouse.up();
  }
}

export const test = base.extend<{ diagram: Diagram }>({
  diagram: async ({ page }, use) => {
    await use(new Diagram(page));
  },
});

export { expect };

// ──────────────────────────────────────────────────────────────────────────
// Internal helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Build a `Remote<T>` for one of the services exposed on `window.__diagram`.
 * Every property access returns a function that, when called, evaluates the
 * underlying method (or signal) inside the page and resolves with its result.
 */
function remoteService<K extends keyof DiagramHandle>(page: Page, serviceKey: K): Remote<DiagramHandle[K]> {
  return new Proxy(Object.create(null), {
    get(_target, prop) {
      if (typeof prop !== 'string') return undefined;
      return (...args: unknown[]) =>
        page.evaluate(
          ({ key, method, callArgs }) => {
            const service = window.__diagram?.[key as keyof DiagramHandle] as Record<string, unknown> | undefined;
            if (!service) {
              throw new Error(`diagram handle not ready (service "${key}")`);
            }
            const target = service[method];
            if (typeof target !== 'function') {
              throw new Error(`window.__diagram.${key}.${method} is not callable`);
            }
            return (target as (...a: unknown[]) => unknown).apply(service, callArgs);
          },
          { key: serviceKey, method: prop, callArgs: args }
        );
    },
  }) as Remote<DiagramHandle[K]>;
}

async function requireBox(
  locator: Locator,
  label: string
): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`${label} has no bounding box`);
  return box;
}

function centerOf(box: { x: number; y: number; width: number; height: number }): Point {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

function cssEscape(value: string): string {
  return value.replace(/(["\\])/g, '\\$1');
}
