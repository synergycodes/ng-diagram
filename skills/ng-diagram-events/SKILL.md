---
name: ng-diagram-events
description: Use when reacting to ng-diagram events - (selectionChanged), nodeDragEnded, viewportChanged, event payloads, addEventListener, setEventsEnabled - or a listener that never fires, fires on every pointer move, or stops after a model reinit.
license: Apache-2.0
---

# Diagram events

Covers the 21 diagram events: the two ways to listen, when each event fires, listener lifecycle, and pausing events. Gesture details stay with their skills (`ng-diagram-linking`, `ng-diagram-edge-relinking`, `ng-diagram-selection-clipboard`, `ng-diagram-palette`, `ng-diagram-resize-rotate-snap`).

## Rules

- **One channel, two surfaces.** Every event is an output on `<ng-diagram>` and a name for `NgDiagramService.addEventListener(name, callback)`, with the same payload (`DiagramEventMap`). Outputs are re-wired after a model change and clean up with the component, so prefer them in the component that renders `<ng-diagram>`. Use `addEventListener` in other components and services under the same `provideNgDiagram()`.
- **Programmatic listeners belong to the current engine.** `<ng-diagram>` creates the engine, so `addEventListener` called earlier (for example in the constructor of the component that renders `<ng-diagram>`) throws `[ngDiagram] Library engine not initialized yet.` Setting a new model destroys the engine and all its listeners. Register in an `effect` on `isInitialized()` (recipe below).
- **Unsubscribe with the returned function.** The library listens on the same channel. `removeEventListener(name)` without a callback also cuts the `(name)` output of `<ng-diagram>`; `removeAllEventListeners()` cuts every output, the `actionState()` signal and internal gesture tracking. Removing the `diagramInit` listeners before that event keeps the canvas hidden (see "Pause events").
- **Handlers run synchronously, after the change is in the model and before change detection.** Read the payload or the getters (`getModel().getNodes()`, `getNodeById(...)`). The `nodes()`, `edges()` and `selection()` signals can still show the previous state inside a handler.
- **Continuous events need care.** `selectionMoved`, `nodeResized`, `selectionRotated` and `viewportChanged` fire on every pointer move. With `boxSelection.realtime` (default `true`), `selectionChanged` fires while the box grows. Save or call APIs on the `*Ended` events, or debounce.
- **Use `edgeDrawEnded`, not `edgeDrawn`.** `edgeDrawn` is deprecated (since 1.2.0) and fires only for successful node-to-node draws. `edgeDrawEnded` fires for every draw: branch on `event.success`.
- **An ended event can be a cancel.** `nodeDragEnded`, `nodeResizeEnded` and `nodeRotateEnded` carry `cancelReason: 'cancelled'` (since 1.3.0) after Escape or `cancelActiveInteraction()`. The payload then holds the restored geometry, so skip your "user changed something" logic.

## Which event for which job

| You want to | Event | When it fires |
| --- | --- | --- |
| Show a toolbar/panel after the user selects | `selectionGestureEnded` (since 1.1.0) | pointerup after a click or box selection that changed the selection, select-all, paste |
| Mirror the selection | `selectionChanged` | every change: pointerdown on an element or empty canvas, Ctrl/Cmd+click, realtime box selection, `select()`, paste, deleting selected elements |
| Save after a drag | `nodeDragStarted` / `nodeDragEnded` (since 1.1.0) | once the pointer has moved a few pixels / on release or cancel |
| Follow positions live | `selectionMoved` | each drag step, arrow-key move and `moveNodesBy()` |
| Resize | `nodeResizeStarted` / `nodeResized` / `nodeResizeEnded` (start/end since 1.1.0) | handle pointerdown / each size change (also `resizeNode()`) / release or cancel |
| Rotate | `nodeRotateStarted` / `selectionRotated` / `nodeRotateEnded` (start/end since 1.1.0) | handle pointerdown / each angle change (also `rotateNodeTo()`) / release or cancel |
| Know about a drawn edge | `edgeDrawEnded` (since 1.2.0) | release, cancel, or when another gesture takes the pointer |
| Know about a reconnected edge | `edgeRelinkStarted` / `edgeRelinkEnded` (since 1.4.0) | once a relink handle has moved a few pixels / release or cancel |
| Know what the user deleted | `selectionRemoved` | Delete/Backspace, `deleteSelection()`, `cut()` |
| Group membership | `groupMembershipChanged` | drop into/out of a group, `addToGroup`/`removeFromGroup`, `updateNodes` changing `groupId` |
| Pasted content | `clipboardPasted` | keyboard paste or `paste()` |
| Palette drop | `paletteItemDropped` | a palette item dropped on the canvas |
| Pan and zoom | `viewportChanged` | every pan/zoom step, programmatic viewport changes, container resize |
| Diagram ready | `diagramInit` | once per model, after the visible elements are measured |

Read `references/event-payloads.md` when you need the exact payload fields, the cancel reasons, or which API calls do not fire an event.

## Listen in the host template

```html
<ng-diagram
  [model]="model"
  (selectionGestureEnded)="onSelectionDone($event)"
  (nodeDragEnded)="onDragEnded($event)"
  (edgeDrawEnded)="onEdgeDrawEnded($event)"
  (viewportChanged)="onViewportChanged($event)"
/>
```

```ts
onSelectionDone({ nodes, edges }: SelectionGestureEndedEvent) {
  this.showToolbar(nodes.length + edges.length > 0);
}

onDragEnded(event: NodeDragEndedEvent) {
  if (event.cancelReason) return; // Escape: the old positions are back
  this.savePositions(event.nodes.map(({ id, position }) => ({ id, position })));
}

onEdgeDrawEnded(event: EdgeDrawEndedEvent) {
  if (event.success) {
    console.log('new edge', event.edge?.id, 'to', event.target?.id ?? 'a free end');
  } else {
    console.log('no edge:', event.reason); // 'noTarget' | 'invalidConnection' | 'invalidTarget' | 'cancelled'
  }
}

onViewportChanged({ viewport }: ViewportChangedEvent) {
  clearTimeout(this.viewportTimer); // fires on every pan/zoom step
  this.viewportTimer = setTimeout(() => localStorage.setItem('viewport', JSON.stringify(viewport)), 300);
}
```

## Listen from another component or service

```ts
@Component({
  selector: 'app-activity-log',
  template: `@for (line of log(); track $index) { <div>{{ line }}</div> }`,
})
export class ActivityLogComponent {
  private readonly diagram = inject(NgDiagramService);
  readonly log = signal<string[]>([]);

  constructor() {
    effect((onCleanup) => {
      if (!this.diagram.isInitialized()) return; // false again while a new model loads
      const unsubscribers = untracked(() => [
        this.diagram.addEventListener('nodeDragEnded', ({ nodes }) => this.add(`moved ${nodes.length} node(s)`)),
        this.diagram.addEventListener('selectionRemoved', ({ deletedNodes, detachedEdges }) =>
          this.add(`deleted ${deletedNodes.length} node(s), kept ${detachedEdges.length} edge(s)`)
        ),
      ]);
      onCleanup(() => unsubscribers.forEach((unsubscribe) => unsubscribe()));
    });
  }

  private add(line: string) {
    this.log.update((lines) => [...lines, line]);
  }
}
```

`isInitialized()` turns `false` when a new model is set and `true` after the new engine's `diagramInit`, so the effect registers again on every engine. These listeners start after `diagramInit`; put init logic in the `(diagramInit)` output or in this effect. `addEventListenerOnce(name, callback)` removes itself after the first call.

## Gesture in progress (no start event)

There is no event for "an edge draw started" or "panning". Read the `actionState()` signal instead:

```ts
readonly isLinking = computed(() => !!this.diagram.actionState().linking); // drawing or relinking an edge
readonly isDragging = computed(() => !!this.diagram.actionState().dragging?.movementStarted);
```

## Pause events during a programmatic batch

```ts
// Restore a saved selection without running your selectionChanged handlers
async restoreSelection(nodeIds: string[]) {
  this.diagram.setEventsEnabled(false); // events are dropped, not queued
  try {
    await this.selectionService.select(nodeIds); // would fire selectionChanged; must commit before events are back on
  } finally {
    this.diagram.setEventsEnabled(true);
  }
}
```

`setEventsEnabled(false)` is a global switch for this diagram: it also silences the `<ng-diagram>` outputs, the `actionState()` signal and internal gesture tracking. Keep it short and never leave it off while the user interacts. `areEventsEnabled()` reads the flag. A new model starts with events enabled. Pause events only while `isInitialized()` is `true`: the diagram shows its canvas from its own `diagramInit` listener, so disabling events (or `removeAllEventListeners()`, `removeEventListener('diagramInit')`) after a new model is set and before its `diagramInit` keeps the canvas hidden and `(diagramInit)` silent. Calls like `updateNode(s)` fire no events anyway (see the reference), so they need no pause.

## Edge cases

- `diagramInit`: programmatic listeners run first. One macrotask later `isInitialized()` becomes `true`, then the `(diagramInit)` output fires, then `zoom.zoomToFit.onInit` runs, so the output sees the viewport before the fit. A new model fires `diagramInit` again.
- With virtualization, `diagramInit.nodes`/`edges` list only the elements rendered at init. Read the full model with `getModel()`.
- `selectionRemoved` fires only for deleting the selection. `deleteNodes`/`deleteEdges` fire no `selectionRemoved`; `selectionChanged` still fires when deleted elements were selected. `detachedEdges` (since 1.4.0) lists edges kept as dangling edges (see `ng-diagram-dangling-edges`).
- `selectionMoved` does not fire for `updateNode(s)` position changes, palette drops or paste. Arrow keys and `moveNodesBy()` fire `selectionMoved` but no drag start/end events.
- `nodeResized` does not fire for `updateNode({ size })` or for size changes from measurement (`autoSize`).
- `groupMembershipChanged` fires for `updateNodes([...])` that change `groupId`, not for a single `updateNode(id, { groupId })`.
- Pressing a port also selects its node (`selectionChanged`) unless `linking.selectNodeOnPortPress` is `false` (since 1.2.0).
- Inside a transaction, events fire once when it commits. A middleware that cancels an update also cancels its events.
- A throwing `addEventListenerOnce` callback stays registered and runs again next time. Async callbacks are not awaited, and their rejections are not caught by the diagram.
- `hasEventListeners(name)` is always `true` for public events while `<ng-diagram>` is mounted (the outputs listen to all of them), so it cannot tell you about your own listeners.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `[ngDiagram] Library engine not initialized yet.` from `addEventListener` | Called before `<ng-diagram>` created its engine. Register in an `effect` on `isInitialized()`, or use outputs. |
| Programmatic listener stops after loading another diagram | A new model means a new engine; old listeners are gone. Re-register on `isInitialized()`. |
| Canvas stays blank after setting a model, `(diagramInit)` never fires, no warning | Events were disabled, or the `diagramInit` listeners removed, before that model's `diagramInit`. Do it only while `isInitialized()` is `true`. |
| `(selectionChanged)` or other outputs stopped firing | `removeEventListener(name)` without a callback or `removeAllEventListeners()` removed the output wiring, or events are still disabled. Use unsubscribe functions; call `setEventsEnabled(true)`. |
| `[ngDiagram] Event listener error: Listener for "X" event threw an error.` | Your `addEventListener` callback threw. Other listeners and the diagram keep working. Errors in `(output)` template handlers go to Angular's `ErrorHandler` instead. |
| Handler reads the old selection or old node data | Signals refresh with change detection. Use the payload (`event.selectedNodes`) or getters. |
| Save runs dozens of times per drag | You listen to `selectionMoved`/`nodeResized`/`viewportChanged`. Use the `*Ended` events or debounce. |
| Toolbar opens on mouse down or flickers during box selection | `selectionChanged` fires on pointerdown and during realtime box selection. Use `selectionGestureEnded`. |
| `selectionRemoved` never fires for my delete button | The button calls `deleteNodes`/`deleteEdges`. Call `NgDiagramSelectionService.deleteSelection()` or react in your own code. |
| `event.source.id` fails to compile after upgrading to 1.4.0 | `EdgeDrawEndedEvent.source` is optional (draws can start from a position). Use `event.source?.id`. |
| Edges created twice after enabling `danglingEdges` | Your app adds an edge on `reason === 'noTarget'`. Since 1.4.0 a canvas drop keeps the dangling edge itself (`success: true`). Remove that code. |
| `nodeDragStarted`/`nodeDragEnded` not paired, or report another gesture's nodes (slow middleware, throwing callbacks) | Fixed in 1.3.0 — upgrade. |
| `diagramInit` arrives late with `[DiagramInitEmitter] Measurement timeout reached ...` | Some visible element is never measured. See `ng-diagram-model-init`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
