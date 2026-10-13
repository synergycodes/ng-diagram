---
name: ng-diagram-layering
description: Use when ng-diagram nodes or edges stack in the wrong order - bring to front / send to back, edges hidden behind nodes, a selected node jumping on top, zOrder vs computedZIndex, a dropdown covered by the next node, or the zIndex config.
license: Apache-2.0
---

# Z-order and layering

How ng-diagram computes the stacking order of nodes and edges, how to change it (`zOrder` in the model, `bringToFront` / `sendToBack`), and the `zIndex` config. Group membership is in the `ng-diagram-groups` skill, hidden elements in `ng-diagram-visibility`.

## Rules

- Write `zOrder`, never `computedZIndex`. `computedZIndex` is system-owned: it is recomputed on changes, and `initializeModel` and `toJSON()` strip it.
- `zOrder` is model data: `toJSON()` keeps it. `bringToFront` / `sendToBack` write `zOrder`, so the user's arrangement survives save and load.
- Children always render above their group. `zOrder` orders siblings; it cannot move a child behind its parent.
- `bringToFront()` / `sendToBack()` without arguments act on the current selection. Any array argument replaces the selection, so `bringToFront([])` does nothing.
- With edge relinking, keep `zIndex.enabled` and `zIndex.elevateOnSelection` on (the defaults). The relink handles are part of the edge, and without elevation a node can cover them so the user cannot grab them.
- Set `zIndex` options when the diagram is created. `<ng-diagram>` reads the `[config]` binding only when the model is (re)initialized, and a later `NgDiagramService.updateConfig` only affects elements that are recomputed afterwards (on selection, `zOrder`, group or endpoint changes, or when added).

## How the order is computed

- Nodes and edges share one stacking context. The library writes `computedZIndex` on every node and edge and applies it as an inline `z-index` on the node wrapper and on `ng-diagram-base-edge`.
- Root node: `zOrder ?? 0` (negative values allowed).
- Node in a group: each child gets its own slot above the parent (parent + 1, parent + 2, ... in sibling order). `zOrder` can raise a child above its slot, never below it. Siblings are ordered unselected first, then by `zOrder` (missing = 0).
- Edge: its `zOrder` if set, otherwise the higher z of its two nodes (+ 1 with `edgesAboveConnectedNodes`).
- Selection (with `elevateOnSelection`): a selected node adds `selectedZIndex` (default 10000) to itself and its descendants, so a selected child of a selected group gets it twice. A selected edge adds it too, and an edge with its own `zOrder` also gets the elevation of a selected endpoint node.
- The edge being drawn gets `temporaryEdgeZIndex`.
- Equal z-index: DOM order decides. All edges come before all nodes, and nodes follow the order of the `nodes` array. So at equal z a node covers an edge, and a node added later covers one added earlier.

## Bring to front / send to back

```ts
import { Component, inject } from '@angular/core';
import { NgDiagramNodeService } from 'ng-diagram';

@Component({
  selector: 'app-arrange-menu',
  template: `
    <button type="button" (click)="toFront()">Bring to front</button>
    <button type="button" (click)="toBack()">Send to back</button>
  `,
})
export class ArrangeMenuComponent {
  private readonly nodeService = inject(NgDiagramNodeService);

  // No arguments: the current selection (selected nodes and edges)
  toFront(): void {
    void this.nodeService.bringToFront();
  }

  toBack(): void {
    void this.nodeService.sendToBack();
  }

  // Explicit ids replace the selection (so bringToFront([]) changes nothing)
  raiseEdge(edgeId: string): Promise<void> {
    return this.nodeService.bringToFront([], [edgeId]);
  }
}
```

What the commands write (since 1.3.0 they return a `Promise<void>` that resolves when the model is updated):

- `bringToFront(nodeIds?, edgeIds?)`: the highest base z of all other nodes (selection elevation ignored) and of the other edges' `zOrder` (missing = 0, never below 0), plus 1. Every target node and edge gets this one value; the descendants of a target group get the next values in hierarchy order, so the group keeps its inner order.
- `sendToBack(nodeIds?, edgeIds?)`: the lowest of the same values (never above 0), minus 1, for every target. Each ancestor of a target node gets one less per level (parent - 1, grandparent - 2), so the whole chain goes behind its siblings.

## Set the order in the model

```ts
import { Component, inject } from '@angular/core';
import {
  NgDiagramComponent,
  NgDiagramModelService,
  NgDiagramNodeService,
  initializeModel,
  provideNgDiagram,
  type NgDiagramConfig,
  type SelectionGestureEndedEvent,
} from 'ng-diagram';

@Component({
  selector: 'app-layered-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" (selectionGestureEnded)="keepOnTop($event)" />`,
})
export class LayeredDiagramComponent {
  private readonly nodeService = inject(NgDiagramNodeService);
  private readonly modelService = inject(NgDiagramModelService);

  model = initializeModel({
    nodes: [
      { id: 'backdrop', position: { x: 0, y: 0 }, zOrder: -10, data: { label: 'Backdrop' } },
      { id: 'task', position: { x: 40, y: 40 }, data: { label: 'Task' } },
      { id: 'sticky', position: { x: 80, y: 60 }, zOrder: 10, data: { label: 'Note' } },
    ],
  });

  config = {
    zIndex: {
      edgesAboveConnectedNodes: true, // edges are drawn over the nodes they connect
    },
  } satisfies NgDiagramConfig;

  // The last clicked node stays on top after it is deselected
  keepOnTop({ nodes, edges }: SelectionGestureEndedEvent): void {
    // One node only: bringToFront gives all targets one shared zOrder (a box selection
    // would lose its order) and gives targeted edges a fixed zOrder.
    if (nodes.length !== 1 || edges.length > 0) return;
    void this.nodeService.bringToFront([nodes[0].id]);
  }

  setOrder(nodeId: string, zOrder: number): Promise<void> {
    return this.modelService.updateNode(nodeId, { zOrder });
  }

  resetOrder(nodeId: string): Promise<void> {
    return this.modelService.updateNode(nodeId, { zOrder: undefined });
  }
}
```

Selection elevation is temporary: a deselected node drops back to its `zOrder` position. The `keepOnTop` handler above makes the last clicked node stay on top; it skips box selections and select-all, which would all get one shared `zOrder`. `updateEdge(id, { zOrder })` works the same way for edges.

## Configuration

`config.zIndex` (`ZIndexConfig`; every key optional in `NgDiagramConfig`):

| Key | Default | Effect |
| --- | --- | --- |
| `enabled` | `true` | `false` turns z-index computation off: every element gets `z-index: 0`, so DOM order decides (nodes always over edges, later nodes over earlier ones, a group listed after its children covers them), and `zOrder`, `bringToFront` and selection have no visible effect |
| `selectedZIndex` | `10000` | added to selected elements (was `1000` before 1.2.3) |
| `elevateOnSelection` | `true` | `false` keeps selected elements at their normal level |
| `edgesAboveConnectedNodes` | `false` | `true` puts each edge without `zOrder` 1 above the higher of its two nodes |
| `temporaryEdgeZIndex` | `2147483647` | z-index of the edge being drawn (was `1000` before 1.2.3); applied even with `enabled: false` |

## Edge cases

- Big groups: children take the slots parent + 1 ... parent + n, so the children of one root group can stack above a neighboring root group with the same or a lower z. Use `bringToFront` on the group that must be on top.
- A node wrapper is its own stacking context (`position: absolute` plus a `z-index`). Content inside a node template, such as a dropdown or a tooltip, cannot rise above a neighbor node with a higher z, or with the same z that comes later in the `nodes` array (the default: root nodes all have z 0). `position: fixed` does not help: node wrappers and `<ng-diagram>` have CSS transforms, and the diagram clips its content. Bring the node to front while the overlay is open, or render the overlay outside the diagram (for example with the Angular CDK Overlay).
- An edge with its own `zOrder` (also one written by `bringToFront` / `sendToBack`) no longer follows its nodes and gets no `edgesAboveConnectedNodes` + 1; only the elevation of a selected endpoint node is added. Remove the `zOrder` to make it follow them again.
- Moving or resizing a node does not change the order. Only selection, `zOrder`, group membership, endpoint changes and added elements trigger a recompute.
- Since 1.4.0 the edge is layered again when its `source` or `target` changes (`updateEdge`, `attachEdge`, relink). Before, it kept the layering of its old nodes.
- `bringToFront`, `sendToBack` and `zOrder` do not skip hidden elements. A call without arguments also moves hidden elements that are still selected.
- Each `bringToFront` writes one more than the highest value of the other elements, so the numbers grow when different elements take turns; that is harmless.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Setting `computedZIndex` does nothing | It is recomputed by the library. Set `zOrder` or call `bringToFront` / `sendToBack`. |
| `bringToFront()` does nothing | Nothing is selected and no ids were passed, an empty array was passed, or `zIndex.enabled` is `false`. |
| Child cannot go behind its group | By design: children always render above their parent. |
| Edges hidden behind nodes | Default: an edge sits at its higher node's level and the node wins the tie. Set `zIndex.edgesAboveConnectedNodes: true`, or give the edge a `zOrder` / `bringToFront([], [edgeId])`. |
| Selected node jumps above everything | Selection elevation (`selectedZIndex`). Set `elevateOnSelection: false`, but not when you use edge relinking. |
| Node drops back behind others after deselecting | Elevation applies only while selected. Call `bringToFront` (for example on `selectionGestureEnded`). |
| Relink handle cannot be grabbed, a node covers it | Keep `zIndex.enabled` and `elevateOnSelection` on. See the `ng-diagram-edge-relinking` skill. |
| Dropdown in a node is covered by the next node | Each node is a stacking context. Bring the node to front while open, or use an overlay outside the diagram. |
| Order differs by a few between groups | Each child takes its own slot above its parent; count those slots when you pick cross-group `zOrder` values. |
| Changing `zIndex` options at runtime has no effect | A changed `[config]` binding is read only at model init, and `updateConfig` reaches only elements recomputed later. Set them at creation or reinitialize the model. |
| Edge keeps old layering after changing its `source`/`target` in code | Fixed in 1.4.0 - upgrade. |
| Children render under their group, siblings not re-sorted | Fixed in 1.2.3 (z-ordering rework) - upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
