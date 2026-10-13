# Bugs fixed in ng-diagram 1.2.0 – 1.4.0

Symptoms of bugs that a newer version fixed, newest first, taken from the Fixed (and fix-like Changed) entries of the CHANGELOG. If the installed version (`node_modules/ng-diagram/package.json`) is older than the "Fixed in" version, upgrade before you look for a workaround. Full notes: https://github.com/synergycodes/ng-diagram/blob/main/CHANGELOG.md

Contents: [1.4.0](#fixed-in-140) · [1.3.0](#fixed-in-130) · [1.2.x](#fixed-in-12x) · [Older](#older)

## Fixed in 1.4.0

| Symptom | Skill |
| --- | --- |
| Ports stay at old positions after a node resize or rotation, console `[ngDiagram] Node measurement failed: Node element not found.`; `<ng-diagram>` is rendered through `ngTemplateOutlet`, a portal or an overlay | `ng-diagram-ports` |
| A node's `size`, port or label geometry becomes 0 × 0 after hiding it with CSS `display: none` | `ng-diagram-visibility` |
| `deleteNodes` on a group leaves its children in the model with a `groupId` of a deleted node; children of a hidden group become visible again | `ng-diagram-groups` |
| A pasted group is empty (copy now includes descendants and the edges between copied nodes) | `ng-diagram-selection-clipboard` |
| Pasting an edge without its nodes adds one more copy of the original connection (now pasted with free ends) | `ng-diagram-selection-clipboard` |
| A pasted manual-routing edge is drawn at the original location | `ng-diagram-selection-clipboard` |
| `zoomToFit({ nodeIds })` zooms out to the whole connected diagram; fitting only hidden nodes shows everything | `ng-diagram-viewport` |
| `computePartsBounds(nodes, [])` includes the point (0, 0); the minimap shows a large empty area for a diagram placed far from the origin | `ng-diagram-viewport`, `ng-diagram-minimap` |
| Arrow keys do nothing with `nodeDraggingEnabled: false` or when only `draggable: false` nodes are selected (they now pan) | `ng-diagram-shortcuts` |
| The cursor flickers while an edge is drawn or relinked | `ng-diagram-custom-edges` |
| The diagram stays in drawing mode after a palm rejection or a system gesture; destroying the diagram mid-draw leaves listeners behind | `ng-diagram-touch` |
| An edge keeps the z-order of its old nodes after `updateEdge` / `attachEdge` changed its `source` or `target` | `ng-diagram-layering` |
| The palette preview paints over the palette or adds page scrollbars at high zoom; the drag image does not match the preview | `ng-diagram-palette` |

## Fixed in 1.3.0

| Symptom | Skill |
| --- | --- |
| After an error in a middleware, the diagram stops applying any change (now the promise of the call rejects) | `ng-diagram-middleware` |
| Mutating service methods return `void`, so code cannot wait for a change (now `Promise<void>`) | `ng-diagram-state-updates` |
| `await transaction(() => { ... })` with a synchronous callback does not wait for the commit | `ng-diagram-transactions` |
| Updates are lost when un-awaited transactions overlap (now a console warning) | `ng-diagram-transactions` |
| `waitForMeasurements` resolves too early when measurement rounds overlap or another update runs at the same time | `ng-diagram-transactions` |
| An error in a custom `ModelAdapter` during initialization leaves nothing measured | `ng-diagram-model-init` |
| Saved dangling edges lose their free-end positions, `Invalid edge coordinates detected` on load | `ng-diagram-dangling-edges` |
| `nodeDragStarted` / `nodeDragEnded` (and resize/rotate) are not paired with slow middlewares; a throwing validator or grouping check leaves a gesture or linking stuck | `ng-diagram-events` |
| Edges anchor to the old side after a port with the same id was re-created elsewhere | `ng-diagram-ports` |
| Port and label positions go stale during fast re-rendering (virtualization while panning) | `ng-diagram-performance` |
| `resizeNode` on an unselected group does nothing | `ng-diagram-groups` |
| A group with children jumps, or resize snapping cuts its children | `ng-diagram-groups` |
| A size corrected right after a resize gesture is overwritten by a stale measurement | `ng-diagram-resize-rotate-snap` |
| A fast pointer release stops a drag, resize or rotation short of the pointer | `ng-diagram-resize-rotate-snap` |
| All shortcuts, Escape too, stop working after a resize started right after clicking a toolbar button | `ng-diagram-shortcuts` |
| A two-finger pan or pinch during a draw connects the edge to a port the user never touched | `ng-diagram-touch` |
| With virtualization on a touch device, a stray touch starts a second gesture during a pan or pinch | `ng-diagram-touch` |

## Fixed in 1.2.x

| Symptom | Fixed in | Skill |
| --- | --- | --- |
| Shift + mouse wheel does not change the panning direction on macOS | 1.2.4 | `ng-diagram-viewport` |
| Children render under their group; siblings are not re-sorted after a `zOrder`, selection or membership change | 1.2.3 | `ng-diagram-layering` |
| Ports or labels are not measured after an element is removed and added again with the same id in one tick | 1.2.3 | `ng-diagram-ports`, `ng-diagram-custom-edges` |
| A `waitForMeasurements` transaction resolves before the ports are measured | 1.2.2 | `ng-diagram-transactions` |
| Several port changes in one transaction race each other | 1.2.2 | `ng-diagram-ports` |
| Text fields and dropdowns inside nodes do not respond on iPhone or iPad | 1.2.2 | `ng-diagram-touch` |
| After a draw that failed to start (for example from a target-only port), no edge can be drawn any more | 1.2.1 | `ng-diagram-linking` |
| `initializeModel` inside `computed` / `effect` / `linkedSignal` throws NG0602 | 1.2.0 | `ng-diagram-model-init` |
| The palette drag preview is missing when an ancestor has `overflow: hidden` | 1.2.0 | `ng-diagram-palette` |
| Port position does not update when `side` or `originPoint` changes | 1.2.0 | `ng-diagram-ports` |
| A `waitForMeasurements` transaction with no-op updates waits 2 seconds | 1.2.0 | `ng-diagram-transactions` |
| Nodes dropped from the palette or pasted are not snapped | 1.2.0 | `ng-diagram-palette` |
| `updateNodeData` / `updateEdgeData` reject interfaces and union types as the data type | 1.2.0 | `ng-diagram-state-updates` |
| The port hit area is not centered on the port | 1.2.0 | `ng-diagram-ports` |

## Older

| Symptom | Fixed in | Skill |
| --- | --- | --- |
| Edge labels vanish after re-initializing the model, or are not measured when the model is loaded with saved `points` | 1.1.0 | `ng-diagram-custom-edges` |
| `selectionChanged` does not fire after a paste | 1.1.0 | `ng-diagram-events` |
| Default edge or minimap breaks on Angular 18 | 1.1.0 | `ng-diagram-setup` |
| Keyboard shortcuts stop working while CapsLock is on | 1.0.0 | `ng-diagram-shortcuts` |
| After re-initializing the model, `zoomToFit` and linking fail (viewport size undefined) | 1.0.0 | `ng-diagram-model-init` |
