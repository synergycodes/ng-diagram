---
name: ng-diagram-linking
description: Use when users draw ng-diagram edges between ports - validateConnection, finalEdgeDataBuilder, edgeDrawEnded, floating edges without ports, startLinking from a button, cancelling a draw, or drawn edges ignoring the custom edge type.
license: Apache-2.0
---

# Linking (user-drawn edges)

How users draw new edges: port rules, connection validation, edge data builders, draw events, drawing from code, cancelling, and floating edges. Moving the ends of existing edges is in `ng-diagram-edge-relinking`, free ends in `ng-diagram-dangling-edges`, ports in `ng-diagram-ports`, touch details in `ng-diagram-touch`.

## Rules

- A draw starts with a press on an `<ng-diagram-port>` and ends on a port within `linking.portSnapDistance` of the pointer. Port `type`: `'source'` only starts edges, `'target'` only receives them, `'both'` does both. A press on a `'target'` port starts nothing.
- Links between two different ports of the same node are allowed. Block self-links in `validateConnection` if you do not want them.
- A drawn edge is built from the last preview edge (the `temporaryEdgeDataBuilder` output) plus the drop target, and then goes through `finalEdgeDataBuilder`. Always return `{ ...edge, ... }`. Set `type`, `routing`, `data` and `relinkable` in `finalEdgeDataBuilder`. The default preview has `targetArrowhead: 'ng-diagram-arrow'`, so drawn edges have it too; set `targetArrowhead: undefined` to remove it.
- Type the callbacks through `Partial<LinkingConfig>` (or annotate their parameters). Inside an object typed `NgDiagramConfig` (also the argument of `updateConfig`), `validateConnection` and the two builders get no parameter types: under `strict` that is error TS7006 (implicit `any`), and a wrong signature is not caught.
- `validateConnection(source, sourcePort, target, targetPort, context)`: the four node and port arguments can be `null` — `sourcePort`/`targetPort` for floating ends, and since 1.4.0 `source`/`target` for a free (dangling) end or a draw started with `startLinkingFromPosition`. The optional `context` (since 1.4.0) has `reason: 'draw' | 'relink' | 'attach'`, plus `edge`/`end` for relink and attach. The validator runs while the pointer is over a port the edge could snap to (a `false` keeps the preview loose) and again on drop, so keep it fast and free of side effects. It is not called for a drop on empty canvas (a kept dangling edge); filter those with `danglingEdges.shouldKeepOnDrop`.
- `(edgeDrawEnded)` (since 1.2.0) fires once per draw, whatever the outcome (except when the source node is deleted during the draw, see Edge cases). Branch on `success` and `target`. `source` is optional since 1.4.0, so read `event.source?.id`. `(edgeDrawn)` is deprecated.
- Cancel a draw with `NgDiagramService.cancelActiveInteraction()` (since 1.3.0) or Escape. Escape reaches the diagram only while focus is inside `<ng-diagram>`, so a toolbar outside it must handle Escape itself (recipe below). There is no `stopLinking` method.

## Validate connections and shape drawn edges

```typescript
import { Component, inject } from '@angular/core';
import {
  initializeModel, NgDiagramComponent, NgDiagramModelService, provideNgDiagram,
  type LinkingConfig, type NgDiagramConfig,
} from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" />`,
})
export class DiagramComponent {
  private readonly modelService = inject(NgDiagramModelService);

  model = initializeModel({ nodes: [], edges: [] });

  // Partial<LinkingConfig> gives the callbacks their parameter types
  linking: Partial<LinkingConfig> = {
    validateConnection: (source, sourcePort, target, targetPort, context) => {
      if (!source || !target) return true; // a free (dangling) end: nothing to compare
      if (source.id === target.id) return false; // no links between ports of the same node
      if (target.type === 'start') return false; // nothing may point into a start node
      // one incoming edge per target port; a relinked edge does not block its own slot
      return !this.modelService
        .getConnectedEdges(target.id)
        .some((e) => e.target === target.id && e.targetPort === targetPort?.id && e.id !== context?.edge?.id);
    },
    // `edge.routing` is set only in relink previews: keep it there
    temporaryEdgeDataBuilder: (edge) => ({ ...edge, routing: edge.routing ?? 'bezier' }),
    finalEdgeDataBuilder: (edge) => ({
      ...edge,
      type: 'flow', // a key of your NgDiagramEdgeTemplateMap
      routing: 'bezier',
      data: { ...edge.data, createdAt: Date.now() },
    }),
  };

  config: NgDiagramConfig = { linking: this.linking };
}
```

| `linking` option | Default | Effect |
| --- | --- | --- |
| `portSnapDistance` | `10` | Distance from the port's box at which the preview snaps. Flow units, so the on-screen distance changes with zoom (the TSDoc says pixels). |
| `selectNodeOnPortPress` | `true` | Pressing a port also selects its node (since 1.2.0). |
| `edgePanningEnabled` / `edgePanningThreshold` / `edgePanningForce` | `true` / `30` / `10` | Pan the viewport while the pointer is within the threshold (px) of the diagram edge. Needs `viewportPanningEnabled`. |
| `validateConnection` | allows all | See Rules. |
| `temporaryEdgeDataBuilder` / `finalEdgeDataBuilder` | return the edge unchanged | See Rules. |
| `defaultRelinkable` | `false` | Relink handles (since 1.4.0), see `ng-diagram-edge-relinking`. |

## React to finished draws

```typescript
import { Component } from '@angular/core';
import { type EdgeDrawEndedEvent } from 'ng-diagram';

@Component({ selector: 'app-diagram', template: '' })
export class DiagramComponent {
  // <ng-diagram [model]="model" (edgeDrawEnded)="onEdgeDrawEnded($event)" />
  onEdgeDrawEnded(event: EdgeDrawEndedEvent) {
    if (event.success && event.target) {
      console.log(`Connected ${event.source?.id} -> ${event.target.id}`, event.edge?.id);
    } else if (event.success) {
      console.log('Kept as a dangling edge at', event.dropPosition, event.edge?.id); // danglingEdges.enabled
    } else {
      console.log('Draw ended without an edge:', event.reason); // noTarget | invalidConnection | invalidTarget | cancelled
    }
  }
}
```

| `reason` | When |
| --- | --- |
| `noTarget` | Released away from a port the edge can take (also over a port with the wrong direction), and no dangling edge was kept. |
| `invalidConnection` | `validateConnection` returned `false` on drop. |
| `invalidTarget` | The snapped target became invalid (deleted, hidden, wrong port type). |
| `cancelled` (since 1.3.0) | Escape, `cancelActiveInteraction()`, a second touch gesture, a lost pointer (since 1.4.0), or the source node became hidden before a drop on a port. |

## Start a draw from a button (toolbar, touch UI)

```typescript
import { Component, inject } from '@angular/core';
import { NgDiagramSelectionService, NgDiagramService } from 'ng-diagram';

@Component({
  selector: 'app-link-toolbar',
  // After a click here the focus stays on this toolbar, so the diagram never sees Escape
  host: { '(document:keydown.escape)': 'cancel()' },
  template: `
    <button (click)="connectFromSelected()">Connect</button>
    <!-- pointerdown, not click: the next click anywhere ends the draw -->
    <button (pointerdown)="cancel()">Cancel</button>
  `,
})
export class LinkToolbarComponent {
  private readonly diagramService = inject(NgDiagramService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  connectFromSelected() {
    const node = this.selectionService.selection().nodes[0];
    if (!node) return;
    // The edge follows the pointer; the next click (or touchend) ends the draw
    this.diagramService.startLinking(node, 'port-right'); // omit the port id for a floating start
  }

  cancel() {
    if (this.diagramService.actionState().linking) {
      void this.diagramService.cancelActiveInteraction(); // edgeDrawEnded reports 'cancelled'
    }
  }
}
```

The next click connects when it lands on a port the edge can take; anywhere else the draw ends with `noTarget`, or keeps a dangling edge when that feature is on. Refused calls log `[ngDiagram] startLinking ignored: another linking or relinking gesture is in progress.` or `[ngDiagram] startLinking ignored: source node "<id>" is missing or effectively hidden.` A `'target'` port, a hidden port or a port id that the node does not render is refused without a message (`'port-right'` exists only on the default node). To start from a point on the canvas instead of a node, use `startLinkingFromPosition` (`ng-diagram-dangling-edges`).

## Floating edges (no ports)

```typescript
import { Component } from '@angular/core';
import { initializeModel, type LinkingConfig, type NgDiagramConfig } from 'ng-diagram';

@Component({ selector: 'app-diagram', template: '' })
export class DiagramComponent {
  model = initializeModel({
    nodes: [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 300, y: 100 }, data: {} },
    ],
    // no sourcePort/targetPort: both ends attach to the node border, facing the other node
    edges: [{ id: 'e1', source: 'a', target: 'b', data: {} }],
  });

  // Drawn edges still start and end on ports; the builders drop the port ids
  linking: Partial<LinkingConfig> = {
    temporaryEdgeDataBuilder: (edge) => ({ ...edge, sourcePort: undefined }),
    finalEdgeDataBuilder: (edge) => ({ ...edge, sourcePort: undefined, targetPort: undefined }),
  };

  config: NgDiagramConfig = { linking: this.linking };
}
```

A floating end belongs to a node but not to a port: it sits on the node border and moves with the node. One end can float while the other uses a port, with any routing. A dangling end is different: it has no node at all (`source: ''`), see `ng-diagram-dangling-edges`.

## Edge cases

- `temporaryEdgeDataBuilder` runs on every pointer move of a draw. It also builds relink previews, which arrive with the relinked edge's `type`, `routing`, `data` and arrowheads, so do not overwrite those blindly (see `edge.routing ?? 'bezier'` above).
- A port refused by `validateConnection` is never snapped to, so a drop on it usually ends with `noTarget`. `invalidConnection` appears when the validator says no on drop after saying yes during the drag.
- Only ports of nodes whose box (`position` and `size`) is within `portSnapDistance` of the pointer can snap. A port that sticks out of the node further than that does not snap over its outer part.
- Touch, draws started from a port: a two-finger pan or pinch cancels them (`cancelled`, since 1.3.0), and so does a `pointercancel` such as palm rejection (since 1.4.0). A draw started with `startLinking` ignores a second finger; the first finger lift ends it (`ng-diagram-touch`).
- When the source node becomes hidden during a draw, no edge is created. When it is deleted, a draw started from a port is cancelled and no `edgeDrawEnded` fires. A draw started with `startLinking` keeps running, so cancel it before you delete its source node.
- `edgeDrawn` (deprecated) fires only for node-to-node edges, never for kept dangling edges.
- Ports hidden with the port `hidden` input cannot start or receive links, and the preview does not snap to them.
- The `[config]` binding is read only when the diagram engine is created. Change linking options later with `NgDiagramService.updateConfig({ linking: this.linking })`, passing a `Partial<LinkingConfig>` object so the callbacks keep their types.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Drawn edges use the default template or routing | Set `type`/`routing` in `finalEdgeDataBuilder`. |
| TS7006 "Parameter 'source' implicitly has an 'any' type" in the config | Build the callbacks in a `Partial<LinkingConfig>` object (recipe), or annotate the parameters. |
| Pressing a port starts no draw | The port has `type="target"` or is hidden, or another draw or relink is running. |
| The preview never snaps to a port | Wrong port direction, `validateConnection` returns `false`, the port is hidden or sticks out of its node, or `portSnapDistance` is too small. |
| Pressing a port also selects the node | `linking.selectNodeOnPortPress: false` (since 1.2.0). |
| Compile error on `event.source.id` after upgrading to 1.4.0 | `source` is optional now: `event.source?.id`. |
| Edges are created twice after enabling dangling edges | Remove code that adds its own edge on `reason === 'noTarget'` (`ng-diagram-dangling-edges`). |
| A Cancel button finishes the draw instead of cancelling it | The next click ends a draw started from code. Cancel on `pointerdown`. |
| Escape does not cancel a draw started from a toolbar button | Focus is on the toolbar, outside `<ng-diagram>`. Handle Escape in the toolbar (recipe). |
| After pressing a target-only port, no edge can be drawn any more | Fixed in 1.2.1 — upgrade. |
| A throwing validator leaves linking stuck | Fixed in 1.3.0 — upgrade. |
| A two-finger gesture during a draw connects to a port the user never pointed at | Fixed in 1.3.0 — upgrade. |
| The diagram stays in drawing mode after a palm rejection or system gesture | Fixed in 1.4.0 — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
