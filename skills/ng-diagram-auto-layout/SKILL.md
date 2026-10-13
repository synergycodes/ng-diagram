---
name: ng-diagram-auto-layout
description: Use when arranging ng-diagram nodes automatically with ELK.js, dagre or another layout engine - trees, org charts, layered flows, applying computed positions and edge points, re-layout after edits, or nodes piled up at (0, 0).
license: Apache-2.0
---

# Auto layout (ELK.js and other engines)

ng-diagram has no built-in automatic layout: a layout library computes positions, and you write them back with the model service. This skill gives a complete ELK.js recipe based on the docs examples "Layout Integration" (https://www.ngdiagram.dev/docs/examples/layout-integration/) and "Expand/Collapse Subtree" (https://www.ngdiagram.dev/docs/examples/expand-collapse/). Routing modes in detail are in `ng-diagram-edge-routing`, hiding in `ng-diagram-visibility`, fitting in `ng-diagram-viewport`.

`npm install elkjs` (the docs examples use elkjs 0.10).

## Rules

- Lay out measured nodes. Run the first layout in `(diagramInit)`: rendered nodes have their real `size` then. For nodes you add later, `await addNodes(nodes, { waitForMeasurements: true })` first (option since 1.3.0). A node without `size` goes into the layout as 0 × 0 and ends up overlapping others.
- Read the input with `modelService.getModel().getNodes()`/`getEdges()`. They are fresh right after an `await`; the `nodes()`/`edges()` signals can still show the previous state there and inside event handlers.
- Lay out what is visible: nodes with `!node.computedHidden` (since 1.4.0) and the edges whose both ends are among them (this also drops dangling edges, whose free end is `''`). Hidden nodes keep their old positions. With groups, lay out top-level nodes only and move each group's content with it (see Edge cases).
- Write the result in one commit (`transaction` with `updateNodes` and `updateEdges`) and `await` it. Never re-create the model to apply a layout: that re-initializes and re-measures the whole diagram.
- Choose who draws the edges. Positions only: edges stay `routingMode: 'auto'` and ng-diagram routes them. Engine routes: set `routingMode: 'manual'` with the engine's `points`. Manual edges keep their points through every node change (drag, resize, content that changes size, your own `updateNodes`), so switch the connected edges back to `'auto'` after such changes (`selectionMoved` covers drags, arrow keys and `moveNodesBy`; also `nodeResized`), or run the layout again. Keep `'auto'` when the engine returned no route: a manual edge without points draws nothing.
- Fit after the layout: `await` the commit, then `await zoomToFit()`. `zoom.zoomToFit.onInit` runs as soon as your `diagramInit` handler starts, before an async layout ends.
- Hide the canvas until the first layout is done with `visibility: hidden` on a wrapper. Do not use `display: none`: elements then measure 0 × 0, those measurements are ignored, and the layout gets no sizes.

## Layered layout with edge routes (perform-layout.ts)

```typescript
import ELK, { type ElkExtendedEdge, type ElkNode } from 'elkjs';
import { type Edge, type Node, type Point } from 'ng-diagram';

const elk = new ELK(); // one instance, reused

const layoutOptions = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'spacing.nodeNode': '50',
  'layered.spacing.nodeNodeBetweenLayers': '50',
};

export interface LayoutResult {
  nodes: { id: string; position: Point }[];
  edges: { id: string; routingMode: 'manual' | 'auto'; points?: Point[] }[];
}

export async function layoutWithElk(nodes: Node[], edges: Edge[]): Promise<LayoutResult> {
  const portKey = (nodeId: string, portId: string) => `${nodeId}:${portId}`;
  const ports = new Set<string>();

  const children = nodes.map(
    (node): ElkNode => ({
      id: node.id,
      width: node.size?.width ?? 0,
      height: node.size?.height ?? 0,
      // measuredPorts positions are relative to the node, as ELK expects
      layoutOptions: { portConstraints: 'FIXED_POS' },
      ports: (node.measuredPorts ?? []).map((port) => {
        ports.add(portKey(node.id, port.id));
        return { id: portKey(node.id, port.id), ...port.position, ...port.size };
      }),
    })
  );

  // An edge end that names a port ELK does not know is attached to the node instead
  const end = (nodeId: string, portId?: string) =>
    portId && ports.has(portKey(nodeId, portId)) ? portKey(nodeId, portId) : nodeId;

  const graph: ElkNode = {
    id: 'root',
    layoutOptions,
    children,
    edges: edges.map(
      (edge): ElkExtendedEdge => ({
        id: edge.id,
        sources: [end(edge.source, edge.sourcePort)],
        targets: [end(edge.target, edge.targetPort)],
      })
    ),
  };

  const result = await elk.layout(graph);
  const placed = new Map((result.children ?? []).map((child) => [child.id, child]));
  const routed = new Map((result.edges ?? []).map((edge) => [edge.id, edge]));

  return {
    nodes: nodes.map(({ id, position }) => ({
      id,
      position: { x: placed.get(id)?.x ?? position.x, y: placed.get(id)?.y ?? position.y },
    })),
    edges: edges.map(({ id }) => {
      const section = routed.get(id)?.sections?.[0];
      // No route from ELK: let ng-diagram route the edge (a manual edge without points draws nothing)
      return section
        ? {
            id,
            routingMode: 'manual' as const,
            points: [section.startPoint, ...(section.bendPoints ?? []), section.endPoint],
          }
        : { id, routingMode: 'auto' as const };
    }),
  };
}
```

ELK returns top-left positions, the same as `node.position`, and absolute edge points for this flat graph. The points are drawn by the edge's routing (the default `orthogonal`, as in the docs example). For positions only, skip the port mapping and the edge results and leave the edges alone.

## Apply, re-run, release (layout.service.ts)

```typescript
@Injectable()
export class LayoutService {
  private readonly diagram = inject(NgDiagramService);
  private readonly modelService = inject(NgDiagramModelService);
  private readonly viewport = inject(NgDiagramViewportService);
  private busy = false;
  private rerun = false;
  private fitRequested = false;

  /** Lays out the visible graph. A call made while a layout runs returns at once; its run (and fit) is merged into one more run. */
  async layout(fit = false): Promise<void> {
    this.fitRequested ||= fit;
    if (this.busy) {
      this.rerun = true;
      return;
    }
    this.busy = true;
    try {
      do {
        this.rerun = false;
        await this.applyLayout();
      } while (this.rerun);
      if (this.fitRequested) {
        this.fitRequested = false;
        await this.viewport.zoomToFit();
      }
    } finally {
      this.busy = false;
    }
  }

  private async applyLayout(): Promise<void> {
    // getModel() reads are fresh; the nodes()/edges() signals can lag right after an await
    const model = this.modelService.getModel();
    // Top-level visible nodes only: a group is one box, its content moves with it
    const nodes = model.getNodes().filter((node) => !node.computedHidden && !node.groupId);
    const ids = new Set(nodes.map((node) => node.id));
    const edges = model.getEdges().filter((edge) => ids.has(edge.source) && ids.has(edge.target));

    const result = await layoutWithElk(nodes, edges);

    // updateNodes on a group does not move its children: shift all descendants by the group's offset
    const positions = result.nodes.flatMap(({ id, position }) => {
      const node = this.modelService.getNodeById(id);
      if (!node) return [];
      const dx = position.x - node.position.x;
      const dy = position.y - node.position.y;
      const descendants = this.modelService.getChildrenNested(id);
      return [
        { id, position },
        ...descendants.map((child) => ({ id: child.id, position: { x: child.position.x + dx, y: child.position.y + dy } })),
      ];
    });

    // One commit for all positions and edge geometry
    await this.diagram.transaction(() => {
      this.modelService.updateNodes(positions);
      this.modelService.updateEdges(result.edges);
    });
  }

  /** Manual (layout) edges do not follow moved nodes: hand them back to ng-diagram routing. */
  releaseManualEdges(event: SelectionMovedEvent): void {
    const toAuto = new Map<string, { id: string; routingMode: 'auto' }>();
    for (const node of event.nodes) {
      for (const edge of this.modelService.getConnectedEdges(node.id)) {
        if (edge.routingMode === 'manual') toAuto.set(edge.id, { id: edge.id, routingMode: 'auto' });
      }
    }
    if (toAuto.size > 0) void this.modelService.updateEdges([...toAuto.values()]);
  }
}
```

Wire it in the component that provides `provideNgDiagram()` and `LayoutService`:

```html
<!-- .canvas { display: flex; height: 100%; visibility: hidden } .canvas.ready { visibility: visible } -->
<div class="canvas" [class.ready]="ready()">
  <ng-diagram
    [model]="model"
    (diagramInit)="onInit()"
    (selectionMoved)="layoutService.releaseManualEdges($event)"
    (edgeDrawEnded)="onEdgeDrawEnded($event)"
    (selectionRemoved)="onSelectionRemoved($event)"
  />
</div>
```

```typescript
protected readonly layoutService = inject(LayoutService);
readonly ready = signal(false);

// After diagramInit the rendered nodes are measured, so ELK gets real sizes
async onInit(): Promise<void> {
  await this.layoutService.layout(true); // layout, then zoomToFit
  this.ready.set(true);
}

onEdgeDrawEnded(event: EdgeDrawEndedEvent): void {
  if (event.success) void this.layoutService.layout();
}

onSelectionRemoved(event: SelectionRemovedEvent): void {
  if (event.deletedNodes.length > 0 || event.deletedEdges.length > 0) void this.layoutService.layout();
}
```

`<ng-diagram>` fills its parent, so the wrapper needs a size. `edgeDrawEnded` exists since 1.2.0. `selectionMoved` fires for user drags and `moveNodesBy`, not for `updateNodes`, so the layout does not trigger it.

## Trees, org charts and other engines

- Trees: use ELK `mrtree`, lay out positions only (edges stay `'auto'`), and pin the root to its old place so the tree does not jump on every re-layout. For expand/collapse, lay out the tree as it will look after the toggle, then commit the `hidden` flags and the positions in one transaction. Both recipes: `references/tree-layout.md`.
- Other engines (dagre, d3-hierarchy, your own): input = node ids with `size.width`/`size.height` plus `source → target` pairs; output = a top-left `{ x, y }` per node, written with one `updateNodes` call. If the engine returns node centers, subtract half the size; edge bend points become `points` with `routingMode: 'manual'`, as above.

## Edge cases

- Ports: port ids repeat across nodes (`port-left` on every node), and ELK resolves an id to a single shape, so the recipe prefixes them with the node id, like the docs example. Port `position` in `measuredPorts` is relative to the node's top-left corner, which is what ELK expects.
- Groups: a flat layout of a group and its children places the children outside the group box, and `updateNodes` on a group does not move its children. The service therefore lays out top-level nodes only and shifts every descendant (`getChildrenNested`) by its group's offset. Edges that end inside a group do not shape the layout; they stay `'auto'` and follow. To arrange the inside of groups too, send them to ELK as nested graphs (`children` inside the group node): ELK returns child positions relative to the group, while ng-diagram stores global positions, so add the group's position. Groups keep their `size`; they do not grow around moved children.
- Virtualization: off-screen nodes are measured only when first rendered, so give nodes a `size` in your data. The `diagramInit` event lists only the rendered elements, so take the layout input from `getModel()`, never from the event payload. `zoomToFit()` is disabled there; use the custom fit from `ng-diagram-viewport`.
- A node that is `hidden` in the initial model is never measured. Give it a `size` in the data, or start it visible and hide it in the same transaction as the first layout (the docs Expand/Collapse example does this).
- `selectionRemoved` fires for the Delete/Backspace key, `deleteSelection()` and `cut()`, not for `deleteNodes`/`deleteEdges`; after your own deletes, run the layout yourself.
- `import ELK from 'elkjs'` is what the docs examples and the Org Chart template use. If your bundler reports `Can't resolve 'web-worker'` (a known elkjs issue), import `elkjs/lib/elk.bundled.js` instead.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Nodes overlap or pile up after layout | Layout ran before measurement (sizes 0): run it in `diagramInit` or after `waitForMeasurements` |
| All nodes stay at `(0, 0)` | No layout ran (no `diagramInit` handler) or its promise rejected: check the console |
| `JsonImportException: Referenced shape does not exist: <id>` | An edge end is not in the node list you passed (hidden, deleted, dangling): filter edges to visible ends |
| Edges stay frozen after nodes move or resize | `routingMode: 'manual'` keeps its points: switch the connected edges to `'auto'` (`selectionMoved`, `nodeResized`) or run the layout again |
| Children end up outside their group after layout | Flat layout of groups: lay out top-level nodes and move descendants with their group (service above) |
| Some edges vanish after layout | `routingMode: 'manual'` without points: keep `'auto'` when the engine gives no route |
| View not fitted, or fitted to the old positions | `await` the commit, then `zoomToFit()`; do not rely on `zoomToFit.onInit` |
| Overlapping nodes flash at load | Hide the wrapper with `visibility: hidden` until the first layout ends |
| Tree jumps on every change | Pin the root (see `references/tree-layout.md`) |
| Expanded nodes flash at their old positions | Lay out the after-toggle tree first, then commit `hidden` + positions together |
| `Can't resolve 'web-worker'` | Import `elkjs/lib/elk.bundled.js` |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
