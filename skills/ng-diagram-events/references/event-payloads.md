# Event payloads (ng-diagram 1.4.0)

The event name is the same as the `<ng-diagram>` output name and the `addEventListener` name. All payload types are exported from `'ng-diagram'` (`DiagramEventMap` maps names to types). `Node`/`Edge` objects in payloads are model snapshots: read them, do not mutate them.

Contents: [Lifecycle](#lifecycle) · [Selection](#selection) · [Node gestures](#node-gestures) · [Edges](#edges) · [Clipboard, palette, viewport](#clipboard-palette-viewport) · [What fires no event](#what-fires-no-event)

## Lifecycle

| Event | Payload | Fires |
| --- | --- | --- |
| `diagramInit` | `DiagramInitEvent { nodes: Node[]; edges: Edge[]; viewport: Viewport }` | Once per model, when the rendered nodes, ports and labels are measured. Hidden elements are not waited for. If measuring stalls for 2 s, it fires anyway after a console warning. With virtualization, `nodes`/`edges` hold only the elements rendered at init. |

## Selection

| Event | Payload | Fires |
| --- | --- | --- |
| `selectionChanged` | `SelectionChangedEvent { selectedNodes: Node[]; selectedEdges: Edge[]; previousNodes: Node[]; previousEdges: Edge[] }` | Whenever the set of selected ids changes in one update: pointerdown on an element or on empty canvas, Ctrl/Cmd+click, box selection (continuously when `boxSelection.realtime` is `true`), select-all, `select`/`deselect`/`deselectAll`, paste, adding or deleting selected elements. `previous*` is the selection before the update. |
| `selectionGestureEnded` (since 1.1.0) | `SelectionGestureEndedEvent { nodes: Node[]; edges: Edge[] }` | On pointerup after a click or box selection that changed the selection, after keyboard select-all, and after a paste. Not after programmatic `select()`/`deselect()`/`deselectAll()`; the next pointerup in the diagram then fires it, even when that click changes nothing. Update UI for programmatic selection from `selectionChanged` or your own code. |
| `selectionMoved` | `SelectionMovedEvent { nodes: Node[] }` | Each drag step, each arrow-key move, each `NgDiagramNodeService.moveNodesBy()` call. `nodes` = nodes whose position changed in that step. |
| `selectionRotated` | `SelectionRotatedEvent { node: Node; angle: number; previousAngle: number }` | Each angle change of a rotate gesture and each `rotateNodeTo()` call. Angles in degrees. |
| `selectionRemoved` | `SelectionRemovedEvent { deletedNodes: Node[]; deletedEdges: Edge[]; detachedEdges: Edge[] }` | Delete/Backspace, `deleteSelection()`, `cut()`. `deletedNodes` includes descendants of deleted groups; `deletedEdges` includes edges removed with their nodes. `detachedEdges` (since 1.4.0) = edges kept as dangling edges by `danglingEdges.detachOnNodeDelete`, after the detach (free end has `''` and an anchor position); `[]` when none. |

## Node gestures

All start/end pairs always come together and report the nodes of their own gesture (fixed in 1.3.0). `cancelReason` (type `GestureCancelReason = 'cancelled'`, since 1.3.0) is set when Escape or `cancelActiveInteraction()` aborted the gesture; the payload then holds the restored geometry.

| Event | Payload | Fires |
| --- | --- | --- |
| `nodeDragStarted` (since 1.1.0) | `NodeDragStartedEvent { nodes: Node[] }` | Once the pointer has moved a few pixels with nodes pressed. `nodes` = selected draggable nodes plus descendants of dragged groups. A click without movement fires no drag events. |
| `nodeDragEnded` (since 1.1.0) | `NodeDragEndedEvent { nodes: Node[]; cancelReason?: 'cancelled' }` | On release (after the final move and any group drop) or on cancel. Final positions. |
| `nodeResizeStarted` (since 1.1.0) | `NodeResizeStartedEvent { node: Node }` | pointerdown on a resize handle. |
| `nodeResized` | `NodeResizedEvent { node: Node; previousSize: Size }` | Each size change of a resize gesture and each `NgDiagramNodeService.resizeNode()` call that changes the size. |
| `nodeResizeEnded` (since 1.1.0) | `NodeResizeEndedEvent { node: Node; cancelReason?: 'cancelled' }` | On release or on cancel. Final size. |
| `nodeRotateStarted` (since 1.1.0) | `NodeRotateStartedEvent { node: Node }` | pointerdown on the rotate handle. |
| `nodeRotateEnded` (since 1.1.0) | `NodeRotateEndedEvent { node: Node; cancelReason?: 'cancelled' }` | On release or on cancel. Final angle. |
| `groupMembershipChanged` | `GroupMembershipChangedEvent { grouped: { nodes: Node[]; targetGroup: GroupNode }[]; ungrouped: Node[] }` | A drag drops nodes into or out of a group, `NgDiagramGroupsService.addToGroup`/`removeFromGroup`, or `updateNodes([...])` changes `groupId`. |

## Edges

| Event | Payload | Fires |
| --- | --- | --- |
| `edgeDrawEnded` (since 1.2.0) | `EdgeDrawEndedEvent { source?: Node; sourcePort?: string; dropPosition: Point; success: boolean; edge?: Edge; target?: Node; targetPort?: string; reason?: EdgeDrawCancelReason }` | Every end of a user draw, except when the source node was deleted during the draw (then nothing fires). On success `edge` is the created edge; `target`/`targetPort` are missing when a canvas drop kept a dangling edge (since 1.4.0, `danglingEdges.enabled`). `source` is missing for draws started with `startLinkingFromPosition` (optional since 1.4.0). `dropPosition` is in flow coordinates. |
| `edgeDrawn` (deprecated) | `EdgeDrawnEvent { edge: Edge; source: Node; target: Node; sourcePort?: string; targetPort?: string }` | Only for successful draws between two nodes. Use `edgeDrawEnded`. |
| `edgeRelinkStarted` (since 1.4.0) | `EdgeRelinkStartedEvent { edge: Edge; end: 'source' \| 'target' }` | Once a relink handle has moved a few pixels. `edge` is the snapshot at the start. |
| `edgeRelinkEnded` (since 1.4.0) | `EdgeRelinkEndedEvent { edge: Edge; end; previousNode?: Node; previousPort?: string; previousPosition?: Point; dropPosition: Point; success: boolean; target?: Node; targetPort?: string; reason?: EdgeRelinkCancelReason }` | On release or cancel. `target`/`targetPort` = the node/port the dragged end now attaches to (for `end: 'source'` this is the new source). Success without `target` = the end was left dangling. `previousPosition` is set only when the end was free before. On failure `edge` is the unchanged snapshot. |

`EdgeDrawCancelReason`:
- `'noTarget'`: dropped on empty canvas (or on a port the preview refused) and no dangling edge was kept.
- `'invalidConnection'`: `linking.validateConnection` returned `false`.
- `'invalidTarget'`: the target is not usable (hidden node, hidden or source-only port, no position).
- `'cancelled'` (since 1.3.0): Escape, `cancelActiveInteraction()`, a second finger or the system took the pointer, or the source node became hidden.

`EdgeRelinkCancelReason`: `'noTarget'` (canvas drop with dangling edges off, or `shouldKeepOnDrop` returned `false`), `'invalidConnection'` (rejected by `validateConnection` with reason `'relink'`, or not a valid target), `'cancelled'` (Escape, `cancelActiveInteraction()`, another gesture took the pointer, or dropped back on the same port).

## Clipboard, palette, viewport

| Event | Payload | Fires |
| --- | --- | --- |
| `clipboardPasted` | `ClipboardPastedEvent { nodes: Node[]; edges: Edge[] }` | After a keyboard paste or `NgDiagramClipboardService.paste()` that added something. The arrays hold the new elements with their new ids. `selectionChanged` fires just before it (same update), `selectionGestureEnded` right after it. |
| `paletteItemDropped` | `PaletteItemDroppedEvent { node: Node; dropPosition: Point }` | A palette item dropped on the canvas. `node` is the created node; `dropPosition` equals `node.position` after the drop was processed. |
| `viewportChanged` | `ViewportChangedEvent { viewport: Viewport; previousViewport: Viewport }` | Every pan/zoom step, programmatic changes (`moveViewport`, `zoom`, `zoomToFit`, `centerOnNode`, ...), and container resizes (`width`/`height`). `Viewport = { x; y; scale; width?; height? }`. |

## What fires no event

- Programmatic `addNodes`/`addEdges`/`updateNode(s)`/`updateEdge(s)`: no gesture events. `edgeDrawEnded` is only for user draws.
- `updateNode(s)` changing `position`, `size` or `angle`: no `selectionMoved`, `nodeResized` or `selectionRotated`. Use `moveNodesBy`, `resizeNode`, `rotateNodeTo` if you need them.
- `deleteNodes`/`deleteEdges`: no `selectionRemoved` (only `selectionChanged` when deleted elements were selected).
- A single `updateNode(id, { groupId })`: no `groupMembershipChanged` (`updateNodes` does fire it).
- Arrow-key moves and `moveNodesBy`, `resizeNode`, `rotateNodeTo`: no `*Started`/`*Ended` events.
- Size changes from measurement (`autoSize`): no `nodeResized`.
- Anything while `setEventsEnabled(false)` is on: events are dropped, not queued.
