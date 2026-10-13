---
name: ng-diagram-edge-relinking
description: Use when users should reconnect existing ng-diagram edges by dragging their ends - defaultRelinkable or per-edge relinkable, relink handles not showing, validating with reason 'relink', edgeRelinkEnded, or styling relink handles.
license: Apache-2.0
---

# Edge relinking

Reconnecting the ends of existing edges by dragging handles (since 1.4.0): enabling it, choosing which edges and ends move, validation, events, handle styling and custom templates. Drawing new edges is in `ng-diagram-linking`. Dropping an end on empty canvas to free it needs `ng-diagram-dangling-edges`.

## Rules

- Relinking is off by default. `linking.defaultRelinkable` sets the default for all edges; an edge's own `relinkable` overrides it. To switch it at runtime call `NgDiagramService.updateConfig({ linking: { defaultRelinkable: true } })`: the `[config]` binding is read only when the diagram engine is created.
- Handles show only on a selected edge that has a routed path and is drawn by `<ng-diagram-base-edge>`, in the default and in custom templates. Draw previews never have handles. There is no public directive for building your own handles.
- Lock edges with `relinkable`, not with the validator. A validator `false` only refuses the port under the pointer, after the user has already grabbed the handle.
- A drop on a port the end can take goes through `linking.validateConnection` with `context.reason === 'relink'`, `context.edge` and `context.end`. The `source` or `target` argument is `null` when the other end of the edge is free.
- The model does not change during the drag. A reverted relink leaves the edge exactly as it was.
- Keep `zIndex.enabled` and `zIndex.elevateOnSelection` on (the defaults). Handles are part of the edge, and without elevation a node can cover them.

| Effective value (`edge.relinkable ?? linking.defaultRelinkable`) | Source end | Target end |
| --- | --- | --- |
| `true` | yes | yes |
| `'source'` | yes | no |
| `'target'` | no | yes |
| `false` (default) | no | no |

## Enable relinking and choose which ends move

```typescript
import { Component } from '@angular/core';
import { initializeModel, NgDiagramComponent, provideNgDiagram, type LinkingConfig, type NgDiagramConfig } from 'ng-diagram';

@Component({
  selector: 'app-diagram',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" [config]="config" />`,
})
export class DiagramComponent {
  linking: Partial<LinkingConfig> = {
    defaultRelinkable: true, // both ends of every edge without its own `relinkable`
    // edges drawn by the user: only the target end can be moved later
    finalEdgeDataBuilder: (edge) => ({ ...edge, relinkable: 'target' }),
    validateConnection: (source, sourcePort, target, targetPort, context) => {
      if (context?.reason === 'relink') {
        return source?.groupId === target?.groupId; // after a relink both ends share a group
      }
      return true;
    },
  };

  config: NgDiagramConfig = { linking: this.linking };

  model = initializeModel({
    nodes: [
      { id: 'a', position: { x: 0, y: 0 }, data: {} },
      { id: 'b', position: { x: 300, y: 0 }, data: {} },
      { id: 'c', position: { x: 300, y: 150 }, data: {} },
    ],
    edges: [
      { id: 'free', source: 'a', sourcePort: 'port-right', target: 'b', targetPort: 'port-left', data: {} },
      // locked: no handles at all
      { id: 'locked', source: 'a', sourcePort: 'port-right', target: 'c', targetPort: 'port-left', relinkable: false, data: {} },
    ],
  });
}
```

The opposite setup also works: keep `defaultRelinkable: false` and give only some edges `relinkable: true`. `finalEdgeDataBuilder` runs only for drawn edges; loaded, added and pasted edges keep their own `relinkable`. `Partial<LinkingConfig>` gives the callbacks their parameter types (see `ng-diagram-linking`).

## Drop outcomes

| Drop | Result | `edgeRelinkEnded` |
| --- | --- | --- |
| On a port the end can take, validator passes | Reconnected to that node and port | `success: true`, `target`, `targetPort` |
| On empty canvas, with `danglingEdges.enabled` and `shouldKeepOnDrop` allowing it | End freed at the drop point (dangling) | `success: true`, no `target` |
| On empty canvas otherwise | Reverted | `reason: 'noTarget'` |
| On a port with the wrong direction, or the port of the other end | Reverted, validator not called | `reason: 'invalidConnection'` |
| Validator returns `false` | Reverted | `reason: 'invalidConnection'` |
| Back on the original port | Nothing changes | `reason: 'cancelled'` |
| Escape, `cancelActiveInteraction()`, a second touch gesture, a lost pointer, or the other end's node hidden meanwhile | Reverted | `reason: 'cancelled'` |

Hidden nodes and ports are not drop targets: a drop over them counts as a drop on empty canvas, so with dangling edges on, the end is freed there. (The `EdgeRelinkCancelReason` TSDoc and the relinking guide say `invalidConnection` for hidden targets; the code treats the drop as empty canvas.)

## React to relinks

```typescript
import { Component, signal } from '@angular/core';
import { type EdgeRelinkEndedEvent, type EdgeRelinkStartedEvent } from 'ng-diagram';

@Component({ selector: 'app-diagram', template: '' })
export class DiagramComponent {
  readonly relinkingEdgeId = signal<string | null>(null);

  // <ng-diagram [model]="model" (edgeRelinkStarted)="onRelinkStarted($event)" (edgeRelinkEnded)="onRelinkEnded($event)" />
  onRelinkStarted(event: EdgeRelinkStartedEvent) {
    this.relinkingEdgeId.set(event.edge.id);
  }

  onRelinkEnded(event: EdgeRelinkEndedEvent) {
    this.relinkingEdgeId.set(null);
    if (!event.success) {
      console.log('Relink reverted:', event.reason); // noTarget | invalidConnection | cancelled
    } else if (event.target) {
      // `target` is the new node of the dragged end — the new source when end === 'source'
      console.log(`${event.end} of ${event.edge.id}: ${event.previousNode?.id} -> ${event.target.id}/${event.targetPort}`);
    } else {
      console.log(`${event.end} of ${event.edge.id} detached at`, event.dropPosition); // dangling edges on
    }
  }
}
```

- `edgeRelinkStarted` carries `edge` (a snapshot at gesture start) and `end`. It fires once the pointer has moved about 5 px; a click on a handle does nothing and fires no events.
- `edgeRelinkEnded` also carries `previousNode`/`previousPort` (the end was connected) or `previousPosition` (the end was free), and `dropPosition` in flow coordinates. `edge` is the changed edge on success and the unchanged snapshot on failure.
- A relink never fires `edgeDrawEnded` or `edgeDrawn`.

## Custom edge templates and relinking from code

```typescript
import { Component, computed, inject, input } from '@angular/core';
import {
  isEdgeEndRelinkable, NgDiagramBaseEdgeComponent, NgDiagramModelService, NgDiagramService,
  type Edge, type EdgeEnd, type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  selector: 'app-wire-edge',
  imports: [NgDiagramBaseEdgeComponent],
  // the base edge draws the relink handles of a selected edge — nothing else to add
  template: `<ng-diagram-base-edge [edge]="edge()" [strokeDasharray]="locked() ? '4 4' : undefined" />`,
})
export class WireEdgeComponent implements NgDiagramEdgeTemplate {
  private readonly diagramService = inject(NgDiagramService);
  edge = input.required<Edge>();

  locked = computed(() => {
    const fallback = this.diagramService.config().linking?.defaultRelinkable ?? false;
    const edge = this.edge();
    return !isEdgeEndRelinkable(edge, 'source', fallback) && !isEdgeEndRelinkable(edge, 'target', fallback);
  });
}

@Component({ selector: 'app-edge-actions', template: '' })
export class EdgeActionsComponent {
  private readonly modelService = inject(NgDiagramModelService);

  // Programmatic relink: validated like a drop, with context.reason === 'attach'
  async reconnect(edgeId: string, end: EdgeEnd, nodeId: string, portId?: string) {
    const applied = await this.modelService.attachEdge(edgeId, end, nodeId, portId);
    if (!applied) console.warn('Connection refused');
  }
}
```

- Handles sit at the first and last point of the edge you pass to `[edge]`, so they follow a path computed in your template.
- `isEdgeEndRelinkable(edge, end, defaultRelinkable)` (since 1.4.0) returns the effective value for one end.
- `attachEdge` (since 1.4.0) checks the node and port like a drop and returns `false` when it refuses. Without `portId` the end attaches to the node border (a floating end), which a drag cannot do: drags snap only to ports.

## Style the handles

Theme variables (set them on `:root` or `ng-diagram`): `--ngd-relink-handle-size` (default `0.75rem`), `--ngd-relink-handle-stroke-width` (`0.1875rem`), `--ngd-relink-handle-halo-size` (`0.25rem`), `--ngd-relink-handle-fill`, `--ngd-relink-handle-fill-hover`, `--ngd-relink-handle-fill-drag`, `--ngd-relink-handle-stroke`, `--ngd-relink-handle-stroke-hover`, `--ngd-relink-handle-stroke-drag`, `--ngd-relink-handle-halo-color-hover`, `--ngd-relink-handle-halo-color-drag`.

Per edge, use the same names with the `--edge-relink-handle-` prefix on `ng-diagram-base-edge`. Each state has its own variable, so set the hover and drag colors together with the default ones:

```scss
ng-diagram-base-edge.my-edge {
  --edge-relink-handle-size: 0.875rem;
  --edge-relink-handle-fill: #fff;
  --edge-relink-handle-fill-hover: #fff;
  --edge-relink-handle-fill-drag: #3b82f6;
  --edge-relink-handle-stroke: #3b82f6;
  --edge-relink-handle-stroke-hover: #3b82f6;
  --edge-relink-handle-stroke-drag: #3b82f6;
  --edge-relink-handle-halo-color-hover: rgba(59, 130, 246, 0.4);
  --edge-relink-handle-halo-color-drag: rgba(59, 130, 246, 0.4);
}
```

Each handle has an invisible grab area 24 screen pixels wide at every zoom level; hovering it shows the halo.

## Edge cases

- While an end is dragged, the original edge is hidden and a preview stands in for it. The preview copies the edge's `type`, `data`, `routing`, arrowheads and labels, then passes through `linking.temporaryEdgeDataBuilder`, so a builder that forces `type` or `routing` also changes relink previews.
- Relinking uses the same `portSnapDistance` and edge panning settings as drawing.
- The preview does not copy `routingMode` and `points`, so a manual-routing edge previews as an automatic path. After the drop it keeps its waypoints, and only the stored end point moves onto the new port.
- An edge whose other end is free (dangling) can be relinked; the validator then gets `null` for that end.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| No handles on a selected edge | The effective value is `false` (set `defaultRelinkable` or `relinkable`), the edge has no routed path yet, or the config was changed through the `[config]` binding after init (use `updateConfig`). |
| A raw SVG edge template has no handles | Handles come only from `<ng-diagram-base-edge>`. Render it in the template. |
| Handles are hidden under nodes | `zIndex.enabled` or `zIndex.elevateOnSelection` is `false`. Turn them back on. |
| Users can drag ends of edges that a validator "locks" | The validator only judges where an end may land; it never stops the drag. Use `relinkable: false` or `'source'`/`'target'`. |
| `TypeError` on `source.id` in `validateConnection` during a relink | The other end is free, so `source` (or `target`) is `null`. Use `source?.id`. |
| A drop on empty canvas always reverts with `noTarget` | Dangling edges are off, or `shouldKeepOnDrop` returned `false` (`ng-diagram-dangling-edges`). |
| The relink preview looks different from the edge | `temporaryEdgeDataBuilder` overwrites `type`/`routing` (keep fields the preview brings, e.g. `routing: edge.routing ?? 'bezier'`), or the edge uses `routingMode: 'manual'` (the preview is routed automatically). |
| `edgeRelinkEnded.target` is a source node | `target` is the new node of the dragged end; check `event.end`. |
| An end cannot be dropped onto a node without ports | Drags snap only to ports. Use `attachEdge(edgeId, end, nodeId)`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
