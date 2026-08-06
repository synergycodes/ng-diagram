import type { Model, Node } from 'ng-diagram';
import { expect, test } from './fixtures/diagram';
import type { Diagram } from './fixtures/diagram';

/**
 * Resize as a gesture (no snapping — library defaults): handle/line semantics
 * per direction, minimum-size clamping, adornment gating, group children
 * containment, and client→flow scale conversion.
 */

const box: Partial<Model> = {
  nodes: [
    {
      id: 'box',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 120 },
      autoSize: false,
      resizable: true,
      data: { label: 'box' },
    },
  ],
  edges: [],
};

/** Group 300×200 with one child fully inside; group center stays clickable. */
const groupWithChild: Partial<Model> = {
  nodes: [
    {
      id: 'grp',
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      autoSize: false,
      isGroup: true,
      resizable: true,
      data: { label: 'group' },
    },
    {
      id: 'child',
      position: { x: 120, y: 130 },
      size: { width: 80, height: 50 },
      autoSize: false,
      groupId: 'grp',
      data: { label: 'child' },
    },
  ],
  edges: [],
};

async function boxNode(diagram: Diagram, id = 'box'): Promise<Node> {
  const node = await diagram.model.getNodeById(id);
  expect(node).toBeDefined();
  return node!;
}

test.describe('resize gestures', () => {
  test('bottom-right handle grows the size and keeps the position', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'bottom-right', { x: 40, y: 30 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 240, height: 150 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 100 });
  });

  test('top-left handle moves the position and keeps the bottom-right corner fixed', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'top-left', { x: 30, y: 20 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 170, height: 100 });
    const node = await boxNode(diagram);
    expect(node.position).toEqual({ x: 130, y: 120 });
    // bottom-right corner unchanged
    expect(node.position.x + node.size!.width).toBe(300);
    expect(node.position.y + node.size!.height).toBe(220);
  });

  test('top-right handle keeps the left and bottom edges fixed', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'top-right', { x: 30, y: -20 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 230, height: 140 });
    const node = await boxNode(diagram);
    expect(node.position).toEqual({ x: 100, y: 80 });
  });

  test('bottom-left handle keeps the right and top edges fixed', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'bottom-left', { x: -30, y: 20 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 230, height: 140 });
    const node = await boxNode(diagram);
    expect(node.position).toEqual({ x: 70, y: 100 });
  });

  test('bottom line resizes only the height', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'bottom', { x: 0, y: 25 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 200, height: 145 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 100 });
  });

  test('left line resizes only the width and moves the position', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'left', { x: -15, y: 0 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 215, height: 120 });
    expect((await boxNode(diagram)).position).toEqual({ x: 85, y: 100 });
  });

  test('top line resizes only the height and moves the position', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'top', { x: 0, y: -20 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 200, height: 140 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 80 });
  });

  test('right line resizes only the width and keeps the position', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'right', { x: 25, y: 0 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 225, height: 120 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 100 });
  });

  test('a gesture resize disables autoSize', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [
          // No autoSize: false — the node starts with autoSize enabled
          {
            id: 'box',
            position: { x: 100, y: 100 },
            size: { width: 200, height: 120 },
            resizable: true,
            data: { label: 'box' },
          },
        ],
        edges: [],
      },
    });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'bottom-right', { x: 40, y: 30 });

    await expect.poll(async () => (await boxNode(diagram)).autoSize).toBe(false);
  });
});

test.describe('resize events', () => {
  test('a resize gesture emits exactly one started/ended pair for the node', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.page.evaluate(() => {
      const log: string[] = [];
      (window as unknown as { __resizeEvents: string[] }).__resizeEvents = log;
      window.__diagram!.diagram.addEventListener('nodeResizeStarted', (e) => log.push(`started:${e.node.id}`));
      window.__diagram!.diagram.addEventListener('nodeResizeEnded', (e) => log.push(`ended:${e.node.id}`));
    });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'bottom-right', { x: 40, y: 30 });

    await expect
      .poll(async () => diagram.page.evaluate(() => (window as unknown as { __resizeEvents: string[] }).__resizeEvents))
      .toEqual(['started:box', 'ended:box']);
  });
});

test.describe('resize validation middleware', () => {
  // The deterministic regression guard for the stale-measurement bug (#771)
  // lives in the unit suite (flow-resize-processor.service.spec.ts) — these
  // tests are the end-to-end reproduction. Whether a single gesture hits the
  // race depends on frame phase, so each test rolls several fast releases and
  // must catch a regression on any of them; retries would mask exactly that.
  test.describe.configure({ retries: 0 });

  const GESTURES = 6;
  // Covers the stale gesture-era batch (pointerup + ~2 frames) plus the
  // gesture-end re-measure's own double-rAF (~2 more)
  const FRAME_SAMPLES = 6;
  const REVERT_THRESHOLD = 220;
  const ORIGINAL = { size: box.nodes![0].size!, position: box.nodes![0].position };

  /** Rolls fast-release resizes past the validation threshold: every revert must apply and hold. */
  async function expectRevertsSurviveFastReleases(diagram: Diagram): Promise<void> {
    for (let i = 1; i <= GESTURES; i++) {
      await diagram.dragResizeHandle('box', 'bottom-right', { x: 60, y: 40 }, { fastRelease: true });

      await expect.poll(async () => (await boxNode(diagram)).size).toEqual(ORIGINAL.size);
      const { maxWidth, widths } = await diagram.page.evaluate(async (frames) => {
        const log = (window as unknown as { __boxWidths: number[] }).__boxWidths;
        const maxWidth = Math.max(...log.splice(0));
        // The stale gesture-era batch lands up to two frames after the pointerup —
        // sample the model each frame and require the revert to hold in all of them
        const widths: number[] = [];
        for (let frame = 0; frame < frames; frame++) {
          await new Promise(requestAnimationFrame);
          widths.push(window.__diagram!.model.getNodeById('box')!.size!.width);
        }
        return { maxWidth, widths };
      }, FRAME_SAMPLES);
      // Canary: the gesture must have crossed the threshold, or this run tested nothing
      expect(maxWidth, `gesture #${i} crossed the validation threshold`).toBeGreaterThan(REVERT_THRESHOLD);
      expect(widths, `gesture #${i} revert survives the trailing batch`).toEqual(
        Array(FRAME_SAMPLES).fill(ORIGINAL.size.width)
      );
    }
  }

  test('a size revert on resizeNodeStop survives a fast release', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.page.evaluate(
      ({ threshold, original }) => {
        const log: number[] = [];
        (window as unknown as { __boxWidths: number[] }).__boxWidths = log;
        // The validation-middleware pattern from GitHub discussion #771: any
        // resize ending wider than the threshold is reverted to the original rect.
        window.__diagram!.diagram.registerMiddleware({
          name: 'resize-validator',
          execute: (context, next) => {
            const node = context.state.nodes.find((n) => n.id === 'box');
            if (node?.size) log.push(node.size.width);
            if (context.modelActionTypes.includes('resizeNodeStop') && node?.size && node.size.width > threshold) {
              next({ nodesToUpdate: [{ id: 'box', ...original }] });
              return;
            }
            next();
          },
        });
      },
      { threshold: REVERT_THRESHOLD, original: ORIGINAL }
    );
    await diagram.node('box').click();

    await expectRevertsSurviveFastReleases(diagram);
  });

  test('a size revert from a nodeResizeEnded listener survives a fast release', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.page.evaluate(
      ({ threshold, original }) => {
        const log: number[] = [];
        (window as unknown as { __boxWidths: number[] }).__boxWidths = log;
        // Same revert wired through the public event instead of a middleware —
        // the write lands in its own later pass, after the gesture state is
        // cleared, and the stale batch threatens it the same way.
        window.__diagram!.diagram.addEventListener('nodeResizeEnded', (e) => {
          const width = e.node.size?.width ?? 0;
          log.push(width);
          if (width > threshold) {
            void window.__diagram!.model.updateNode('box', { ...original });
          }
        });
      },
      { threshold: REVERT_THRESHOLD, original: ORIGINAL }
    );
    await diagram.node('box').click();

    await expectRevertsSurviveFastReleases(diagram);
  });
});

test.describe('resize minimum size', () => {
  test('bottom-right shrink clamps at the minimum with the position unchanged', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    // Way past the default 20×20 minimum
    await diagram.dragResizeHandle('box', 'bottom-right', { x: -300, y: -300 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 20, height: 20 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 100 });
  });

  test('top-left shrink clamps at the minimum keeping the bottom-right corner fixed', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await diagram.dragResizeHandle('box', 'top-left', { x: 300, y: 300 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 20, height: 20 });
    // bottom-right corner stays at (300, 220)
    expect((await boxNode(diagram)).position).toEqual({ x: 280, y: 200 });
  });
});

test.describe('resize adornment gating', () => {
  test('a resizable node shows four handles and four lines when selected', async ({ diagram }) => {
    await diagram.load({ model: box });
    await diagram.node('box').click();

    await expect(diagram.node('box').locator('.resize-handle')).toHaveCount(4);
    await expect(diagram.node('box').locator('.resize-line')).toHaveCount(4);
  });

  test('a non-resizable node shows no handles when selected', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [{ ...box.nodes![0], resizable: false }],
        edges: [],
      },
    });
    await diagram.node('box').click();

    await expect(diagram.node('box')).toBeVisible();
    await expect(diagram.node('box').locator('.resize-handle')).toHaveCount(0);
  });

  test('a rotated node shows no handles when selected', async ({ diagram }) => {
    await diagram.load({
      model: {
        nodes: [{ ...box.nodes![0], angle: 45 }],
        edges: [],
      },
    });
    await diagram.node('box').click();

    await expect(diagram.node('box')).toBeVisible();
    await expect(diagram.node('box').locator('.resize-handle')).toHaveCount(0);
  });
});

test.describe('group resize and children', () => {
  test('with containment enabled a shrink stops at the children bounds', async ({ diagram }) => {
    await diagram.load({ model: groupWithChild });
    await diagram.page.evaluate(() => {
      window.__diagram!.diagram.updateConfig({ resize: { allowResizeBelowChildrenBounds: false } });
    });
    await diagram.node('grp').click();

    // Containment uses the child's measured bounds (they include the port
    // overhang, so they are slightly larger than the child's model rect)
    const child = await boxNode(diagram, 'child');
    const bounds = child.measuredBounds!;
    const minWidth = bounds.x + bounds.width - 100;
    const minHeight = bounds.y + bounds.height - 100;

    await diagram.dragResizeHandle('grp', 'bottom-right', { x: -220, y: -160 });

    await expect.poll(async () => (await boxNode(diagram, 'grp')).size).toEqual({ width: minWidth, height: minHeight });
    expect((await boxNode(diagram, 'grp')).position).toEqual({ x: 100, y: 100 });
  });

  test('with containment enabled a top-left shrink stops at the children bounds', async ({ diagram }) => {
    await diagram.load({ model: groupWithChild });
    await diagram.page.evaluate(() => {
      window.__diagram!.diagram.updateConfig({ resize: { allowResizeBelowChildrenBounds: false } });
    });
    await diagram.node('grp').click();

    const child = await boxNode(diagram, 'child');
    const bounds = child.measuredBounds!;

    // Way past the child: the anchored bottom-right corner stays at (400, 300),
    // the dragged corner stops at the child's measured bounds
    await diagram.dragResizeHandle('grp', 'top-left', { x: 300, y: 250 });

    await expect.poll(async () => (await boxNode(diagram, 'grp')).position).toEqual({ x: bounds.x, y: bounds.y });
    const group = await boxNode(diagram, 'grp');
    expect(group.size).toEqual({ width: 400 - bounds.x, height: 300 - bounds.y });
  });

  test('with containment disabled (default) a shrink can go below the children bounds', async ({ diagram }) => {
    await diagram.load({ model: groupWithChild });
    await diagram.node('grp').click();

    await diagram.dragResizeHandle('grp', 'bottom-right', { x: -220, y: -160 });

    await expect.poll(async () => (await boxNode(diagram, 'grp')).size).toEqual({ width: 80, height: 40 });
    expect((await boxNode(diagram, 'grp')).position).toEqual({ x: 100, y: 100 });
  });

  test('an unselected group resizes programmatically', async ({ diagram }) => {
    await diagram.load({ model: groupWithChild });

    await diagram.nodes.resizeNode('grp', { width: 343, height: 217 }, undefined, true);

    await expect.poll(async () => (await boxNode(diagram, 'grp')).size).toEqual({ width: 343, height: 217 });
    expect((await boxNode(diagram, 'grp')).position).toEqual({ x: 100, y: 100 });
  });
});

test.describe('resize under zoom', () => {
  test('a handle drag converts client deltas to flow deltas at 2x zoom', async ({ diagram }) => {
    await diagram.load({
      model: {
        ...box,
        metadata: { viewport: { x: 0, y: 0, scale: 2 } },
      },
    });
    await diagram.node('box').click();

    // 80×60 client px at scale 2 = 40×30 in flow coordinates
    await diagram.dragResizeHandle('box', 'bottom-right', { x: 80, y: 60 });

    await expect.poll(async () => (await boxNode(diagram)).size).toEqual({ width: 240, height: 150 });
    expect((await boxNode(diagram)).position).toEqual({ x: 100, y: 100 });
  });
});
