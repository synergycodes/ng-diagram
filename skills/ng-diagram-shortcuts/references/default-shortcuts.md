# ng-diagram shortcuts — full reference (1.4.0)

Contents: default actions · modifiers per OS · matching rules · arrow keys, steps and zoom

## Default actions

`primary` = Ctrl on Windows/Linux, Cmd on macOS.

| Action | Default binding | Kind | What it does |
| --- | --- | --- | --- |
| `copy` | primary + C | keyboard | Copies the selected visible elements to the diagram's internal clipboard (not the system clipboard). |
| `cut` | primary + X | keyboard | `copy`, then `deleteSelection`. |
| `paste` | primary + V | keyboard | Pastes the internal clipboard. If the mouse moved in the last 5 seconds, the content is placed at the mouse pointer, even when the pointer is outside the diagram. Otherwise it lands 20 px right and down from the copied position. Paste details: `ng-diagram-selection-clipboard`. |
| `deleteSelection` | Delete, Backspace | keyboard | Deletes the selected elements. Selected elements that are effectively hidden are skipped (since 1.4.0). |
| `selectAll` | primary + A | keyboard | Selects all visible nodes and edges (hidden ones are skipped, since 1.4.0). |
| `cancelInteraction` | Escape | keyboard (since 1.3.0) | Runs `NgDiagramService.cancelActiveInteraction()`. Escape is left to the browser (not prevented) when nothing can be cancelled. |
| `keyboardMoveSelectionUp` / `Down` / `Left` / `Right` | ArrowUp / ArrowDown / ArrowLeft / ArrowRight | keyboard | Moves the selection when it can move (see "Arrow keys"). |
| `keyboardPanUp` / `Down` / `Left` / `Right` | ArrowUp / ArrowDown / ArrowLeft / ArrowRight | keyboard | Pans the viewport when the selection cannot move. |
| `keyboardZoomIn` / `keyboardZoomOut` | `=` / `-` | keyboard (since 1.1.0) | Zooms by a factor of `1 + zoom.step` / `1 - zoom.step` (`zoom.step` defaults to `0.03`), meant to keep the viewport center in place. In 1.4.0 the fixed point is the center only when `<ng-diagram>` sits at the page's top-left; otherwise it is shifted up and left by the diagram's offset on the page. |
| `undo` / `redo` | primary + Z / primary + Y | keyboard | Calls `undo()` / `redo()` on the `ModelAdapter`. The default model only logs a console warning. |
| `boxSelection` | Shift held | pointer-only | A press with these modifiers anywhere in the diagram (also on a node) starts a selection box. |
| `multiSelection` | primary held | pointer-only | Click adds an element to the selection, or removes it if it is already selected. Click on empty canvas keeps the selection. |
| `zoom` | primary held | wheel-only (since 1.1.0) | Mouse wheel with these modifiers zooms at the pointer. A wheel event with the Ctrl key (also a trackpad pinch) always zooms, whatever this binding says. |

## Modifiers per OS

| `InputModifiers` key | Windows / Linux | macOS |
| --- | --- | --- |
| `primary` | Ctrl | Cmd |
| `secondary` | Alt | Option |
| `shift` | Shift | Shift |
| `meta` | Windows key | Cmd |

- The OS is detected from `navigator.userAgent`.
- On macOS the Control key is not reported as any modifier, so a binding cannot require it.

## Matching rules

1. A key press matches a binding when the `key` matches and `primary`, `secondary` and `shift` match exactly: a modifier you do not list must not be pressed. `meta` is compared only when the binding sets it.
2. `key` is compared with `KeyboardEvent.key`. One-character keys match in any case (`'a'` matches `'a'` and `'A'`). Longer key names (`'ArrowUp'`, `'Delete'`, `'Escape'`) must match exactly.
3. `KeyboardEvent.key` is the character the key produces. With Shift or Option the character can change (for example Shift + `=` gives `+` on a US layout), so check what the browser reports before you bind such keys.
4. A binding without `key` never matches a key press. It is only for the pointer action (`boxSelection`, `multiSelection`) and wheel action (`zoom`).
5. Every action that matches runs, in the order of the `shortcuts` array. Only the arrow-key move and pan pair is designed to be exclusive.
6. When at least one action matches, `preventDefault()` is called on the key event (so Ctrl/Cmd + A does not select page text and arrow keys do not scroll the page). It is not called when the focused element is an `input`, `textarea`, `select` or has a `contenteditable` attribute: then the key is ignored by the diagram.
7. The listener is on `document`, but it reacts only when `document.activeElement` is inside this `<ng-diagram>` element. With several diagrams on one page, only the focused one reacts.

## Arrow keys, steps and zoom

- The selection moves when `nodeDraggingEnabled` is `true` and at least one selected node is visible and not `draggable: false` (since 1.4.0; before, arrow keys did nothing when the selection could not move). Otherwise the arrow keys pan, if `viewportPanningEnabled` is `true`.
- Move step: for each moved root node, `snapping.computeSnapForNodeDrag(node) ?? snapping.defaultDragSnap`; the largest value wins (10 × 10 px by default). The step is used even when drag snapping is off.
- When a moved node would leave the visible area (minus `selectionMoving.edgePanningThreshold`), the viewport follows it (if `viewportPanningEnabled`).
- Keyboard move fires `selectionMoved`, not `nodeDragStarted` / `nodeDragEnded`.
- Pan step: 10 screen pixels per key press (not configurable).
- If you bind extra keys to the move actions (for example WASD), bind them to the matching `keyboardPan*` actions too if they should pan when nothing can move.
