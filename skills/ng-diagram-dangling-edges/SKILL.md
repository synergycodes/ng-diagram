---
name: ng-diagram-dangling-edges
description: Use when ng-diagram edges need free (unconnected) ends - danglingEdges config, keeping edges dropped on empty canvas or whose node was deleted, drawing from a canvas point (startLinkingFromPosition), detachEdge/attachEdge, isDanglingEdge.
license: Apache-2.0
---

# Dangling edges

Edges with one or both ends not connected to a node: the model shape, switching the feature on, keeping dropped draws and the edges of deleted nodes, drawing from a canvas point, detach/attach from code, helpers, events and styling. The `danglingEdges` config, `detachEdge`/`attachEdge`, `startLinkingFromPosition`, the helpers, `detachedEdges` and the CSS classes are since 1.4.0; an edge with a `''` end and its position is drawn in older versions too (and loads from a saved model since 1.3.0). Dragging ends of existing edges is in `ng-diagram-edge-relinking`. Floating ends (on a node, without a port) are in `ng-diagram-linking`.

## Rules

- A free end has `source` or `target` set to the empty string `''` (never `null` or `undefined`), no port (`sourcePort`/`targetPort` is `undefined`), and its anchor in `sourcePosition`/`targetPosition`, in flow coordinates. Without the anchor the edge logs `Invalid edge coordinates detected`; with a port on a free end it is not drawn at all.
- `danglingEdges.enabled` (default `false`) switches on the user features: draws dropped on empty canvas are kept, a relink dropped on empty canvas frees that end, and `detachEdge`, `startLinkingFromPosition` and `detachOnNodeDelete` work. Dangling edges that you load or add are drawn either way. To switch it at runtime use `NgDiagramService.updateConfig()`; the `[config]` binding is read only when the diagram engine is created.
- Before you turn it on, remove code that adds its own edge in `edgeDrawEnded` when `reason === 'noTarget'`. Since 1.4.0 such a drop arrives as `success: true` with the created edge, so that code would create a second edge.
- `linking.validateConnection` is not called for a drop on empty canvas: a draw kept as a dangling edge and an edge end relinked onto the canvas skip it. Filter those with `shouldKeepOnDrop` (below).
- Detect free ends with `isDanglingEdge(edge)` and `hasFreeEndpoint(edge, end?)` instead of string checks spread over templates.
- A free end's position is your data: `toJSON()` saves it and `initializeModel` restores it (since 1.3.0). The positions of connected ends are computed by the library.

## Switch it on, keep dropped draws and the edges of deleted nodes

```typescript
import { Component } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, provideNgDiagram, type NgDiagramConfig, type SelectionRemovedEvent,
} from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" (selectionRemoved)="onRemoved($event)" />`,
})
export class DiagramComponent {
  config: NgDiagramConfig = {
    danglingEdges: {
      enabled: true,
      // keep a draw dropped on empty canvas only when it starts at an "out" port
      shouldKeepOnDrop: (edge, dropPosition) => edge.sourcePort?.startsWith('out') ?? false,
      detachOnNodeDelete: true,
      // keep edges that lose their target node; delete edges that lose their source
      shouldDetachOnNodeDelete: (edge, deletedNode, end) => end === 'target',
    },
    // optional: drag a selected edge's end onto the canvas to detach it, or a free end onto a port to connect it
    linking: { defaultRelinkable: true },
  };

  model = initializeModel({
    nodes: [{ id: 'n1', position: { x: 300, y: 100 }, data: {} }],
    edges: [
      {
        id: 'loose',
        source: '', // free end: empty string, no port
        sourcePosition: { x: 100, y: 140 }, // its anchor, in flow coordinates
        target: 'n1',
        targetPort: 'port-left',
        data: {},
      },
    ],
  });

  onRemoved(event: SelectionRemovedEvent) {
    // snapshots after the detach: freed ends already have '' and their anchor position
    console.log('deleted', event.deletedEdges.length, 'detached', event.detachedEdges.map((e) => e.id));
  }
}
```

- `shouldKeepOnDrop(edge, dropPosition)` sees the final edge, after `linking.finalEdgeDataBuilder`; `false` discards it. For a relink it gets the edge as it would be after the detach, and `false` reverts the relink. Without the callback every canvas drop is kept.
- `shouldDetachOnNodeDelete(edge, deletedNode, end)` runs once for each end that loses its node; `false` deletes the edge.
- Detach rules, for the Delete key, `deleteSelection()`, `cut()` (Ctrl+X) and `NgDiagramModelService.deleteNodes()`:
  - With the Delete key, `deleteSelection()` and `cut()`, an edge that is itself selected is deleted, never detached. `deleteNodes()` has no such exception: it detaches selected edges too.
  - An edge that is hidden only because of the node it loses (for example inside a deleted collapsed group) is deleted, so hidden wiring never shows up as a dangling edge. An edge hidden for another reason is detached and stays hidden.
  - An edge that loses both ends in one delete is deleted, unless `shouldDetachOnNodeDelete` exists and returns `true` for both ends.
  - A freed end stays where its port was (otherwise at the routed end of the edge, or at the node center).
- `selectionRemoved.detachedEdges` (since 1.4.0) lists the detached edges and is `[]` when there are none. `deleteNodes()` detaches but fires no `selectionRemoved`.

## Draw from a point on the canvas (context menu)

```typescript
import { Component, inject } from '@angular/core';
import { NgDiagramService, NgDiagramViewportService, type Point } from 'ng-diagram';

@Component({
  selector: 'app-canvas-menu',
  template: `<button (click)="drawFromHere()">Draw edge from here</button>`,
})
export class CanvasMenuComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly viewportService = inject(NgDiagramViewportService);

  private menuClientPoint: Point = { x: 0, y: 0 };

  // call from (contextmenu) on the diagram container
  open(event: MouseEvent) {
    event.preventDefault();
    this.menuClientPoint = { x: event.clientX, y: event.clientY };
  }

  drawFromHere() {
    const start = this.viewportService.clientToFlowPosition(this.menuClientPoint);
    // requires danglingEdges.enabled; the next click ends the draw (port = connect, canvas = both ends free)
    this.diagramService.startLinkingFromPosition(start);
  }
}
```

- `startLinkingFromPosition(position)` (since 1.4.0) takes flow coordinates. The free end follows the pointer until the next click or finger lift. On a port, the edge gets that target and keeps its free source. On empty canvas, both ends are free (a dual dangling edge), kept when `shouldKeepOnDrop` allows it.
- `validateConnection` receives `source: null` for these draws, and `edgeDrawEnded.source` is `undefined`.
- Refused calls log `[ngDiagram] startLinkingFromPosition ignored: dangling edges are disabled. Set config.danglingEdges.enabled = true to draw edges from a position.` or `[ngDiagram] startLinkingFromPosition ignored: another linking or relinking gesture is in progress.`

## Detach, attach and find loose ends from code

```typescript
import { Component, computed, inject } from '@angular/core';
import { hasFreeEndpoint, isDanglingEdge, NgDiagramModelService, type Edge } from 'ng-diagram';

@Component({
  selector: 'app-loose-ends',
  template: `<span>{{ danglingEdges().length }} loose edges</span>`,
})
export class LooseEndsComponent {
  private readonly modelService = inject(NgDiagramModelService);

  readonly danglingEdges = computed(() => this.modelService.edges().filter(isDanglingEdge));

  isSourceFree(edge: Edge) {
    return hasFreeEndpoint(edge, 'source');
  }

  async detachTarget(edgeId: string) {
    await this.modelService.detachEdge(edgeId, 'target'); // stays where its port was
  }

  async reconnectLooseEnds(range = 50) {
    for (const { edge, end, position } of this.modelService.getDanglingEndpoints()) {
      const port = this.modelService.getNearestPortInRange(position, range);
      if (port) {
        await this.modelService.attachEdge(edge.id, end, port.nodeId, port.id); // false when refused
      }
    }
  }
}
```

- `detachEdge(edgeId, end, position?)` frees one end; without `position` it stays where it is now. With the feature off it does nothing and logs `[ngDiagram] detachEdge ignored: dangling edges are disabled. Set config.danglingEdges.enabled = true to detach edge endpoints.` On an end that is already free, it only moves the anchor to `position`.
- `attachEdge(edgeId, end, nodeId, portId?)` connects an end after the same checks as a relink drop, then calls `validateConnection` with `reason: 'attach'`. It resolves to `false` when refused. It works with the feature off and also on connected ends (it moves them).
- `getDanglingEndpoints()` and `getNearestDanglingEndpointInRange(point, range)` on the model service return `{ edge, end, position }` entries (two for a dual dangling edge) and skip hidden and preview edges. The package also exports pure versions that take an edge list, plus `computeDetachAnchor(edge, end, node)`.

## Style dangling edges

```scss
// any edge with a free end
ng-diagram-base-edge.dangling {
  --edge-stroke-dasharray: 6 4;
  --edge-stroke-opacity: 0.7;
}
```

`ng-diagram-base-edge` and its `path` get the `dangling` class, and the `<ng-diagram-edge>` wrapper gets `ng-diagram-edge--dangling`. Draw previews never get them, although they always have a free end. To recolor dangling default edges, set the default-edge variable on them: `ng-diagram-base-edge.dangling { --ngd-default-edge-stroke: #f59e0b; }`. A page rule on `--edge-stroke` loses to the default edge's own rule (`ng-diagram-custom-edges`).

## Edge cases

- A drop over a port the edge cannot take (wrong direction, its own source port, or refused by `validateConnection`) is not an empty-canvas drop: the draw is discarded with `noTarget`.
- A draw whose source node became hidden is not kept.
- Dual dangling edges are routed between their anchors with any routing.
- Copy with the feature on: a dangling edge goes with its one connected node. With the feature off it is copied only when selected.
- Paste turns every end whose node was not copied into a free end, also with the feature off, so pasting a single edge gives a free edge (since 1.4.0). Pasted free ends move with the pasted content.
- Box selection picks a dangling edge by its free-end anchors (since 1.4.0).
- For manual-routing edges, detach and attach also move the matching end point of `points`.
- `edgeDrawn` (deprecated) never fires for dangling edges.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Edges are created twice after enabling the feature | An `edgeDrawEnded` handler adds an edge on `reason === 'noTarget'`. Remove it; check `event.success && !event.target` instead. |
| A draw dropped on the canvas disappears | Feature off, `shouldKeepOnDrop` returned `false`, the drop was over a port the edge cannot take, or the source node is hidden. |
| `[ngDiagram] detachEdge ignored: dangling edges are disabled. …` | Set `danglingEdges.enabled: true` (or `updateConfig` at runtime). |
| `[ngDiagram] startLinkingFromPosition ignored: dangling edges are disabled. …` | Same. |
| `[ngDiagram] Invalid edge coordinates detected for edge '<id>'` on an edge with `''` | The free end has no `sourcePosition`/`targetPosition`. Add the anchor. |
| A dangling edge is invisible and there is no error | The free end still has a `sourcePort`/`targetPort`. Remove it. |
| Deleting a node still deletes its edges | Needs `enabled` and `detachOnNodeDelete`; the edge was selected too (Delete key, `deleteSelection()`, `cut()`), lost both ends, was hidden only through that node, or the callback returned `false`. |
| An `edgeDrawEnded` handler treats kept dangling edges as connections | Check `event.target`: it is `undefined` for a kept dangling edge. |
| A saved model with dangling edges loses the free ends or logs "Invalid edge coordinates" on load | Fixed in 1.3.0 — upgrade. |
| A pasted edge is not connected to anything | Expected since 1.4.0 when its nodes were not copied. Copy the nodes too, or reconnect with `attachEdge`. |
| No `selectionRemoved` after `deleteNodes()` | That event is only for the Delete key, `deleteSelection()` and `cut()`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
