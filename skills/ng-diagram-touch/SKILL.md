---
name: ng-diagram-touch
description: Use when an ng-diagram app must work on phones or tablets - pinch zoom, two-finger pan, long-press box selection, drawing edges by finger, an on-screen editing toolbar, or touch bugs (inputs in nodes, cancelled draws, palette on iPad).
license: Apache-2.0
---

# Touch and Mobile

How ng-diagram behaves on touch screens, what you must build yourself (buttons for actions that have no gesture), and the touch-specific edge cases. Linking details are in `ng-diagram-linking`, selection and clipboard in `ng-diagram-selection-clipboard`, the palette in `ng-diagram-palette`.

## Rules

- Touch support is built in. `<ng-diagram>` handles touch and pointer events itself, so do not add your own touch listeners for pan, zoom, select or drag, and do not override its `touch-action: none` - the library relies on it to stop the browser from scrolling or zooming the page during a gesture.
- Copy, cut, paste, delete, undo and redo have no touch gesture, and neither has "add to selection" (the `multiSelection` binding needs a modifier key). Give touch users on-screen buttons that call the services.
- One finger never pans the canvas. Panning and pinch zoom use two fingers; a one-finger swipe on empty canvas only clears the selection.
- Put `data-no-drag="true"` on inputs, buttons and other interactive elements inside node templates, or a finger on them drags the node. The value must be the string `"true"`. `data-no-pan="true"` keeps a pan from starting on the element (see `ng-diagram-custom-nodes`).
- Call `NgDiagramService.startLinking` from a `(click)` handler. On touch the draw follows the finger and ends on the next finger lift anywhere on the page, so starting it on `pointerdown`/`touchstart` ends it on the same lift.
- Every mutating service method returns a Promise (since 1.3.0): `await` it when the next line depends on the result, otherwise `void` it.

## Gesture map

| Gesture | Result |
| --- | --- |
| Tap a node or an edge | Selects it. Tapping a node that is already selected keeps the whole selection, so one finger can then drag a multi-selection. |
| Tap or swipe on empty canvas | Clears the selection. No pan. |
| One-finger drag on a node | Moves the node (or the selection). Respects `nodeDraggingEnabled` and the node's `draggable`. |
| Long press (hold 400 ms, moving 10 px or less), then drag | Box selection. Uses the `boxSelection` config (`partialInclusion`, `realtime`). The `Shift` binding is desktop only. |
| Two fingers moving together | Pans. Needs `viewportPanningEnabled` (default `true`); does not start when the touch begins on a `data-no-pan="true"` element. |
| Two-finger pinch | Zooms around the point between the fingers, once the finger distance has changed by more than 40 px. Clamped to `zoom.min`/`zoom.max`. |
| Drag a resize or rotate handle of a selected node | Resizes or rotates the node. |
| Drag from a port, lift over another port | Draws an edge (see `ng-diagram-linking`). |
| Drag a handle at the end of a selected edge | Relinks that end (since 1.4.0, see `ng-diagram-edge-relinking`). The handle's grab area stays 24 px wide on screen at every zoom level. |
| Drag a palette item, lift over the diagram | Drops a node where the finger lifts (see `ng-diagram-palette`). |

## Gesture priority

- Two fingers win. A two-finger pan or pinch ends any one-finger gesture: a drag, resize or rotation stops where it is and is kept (its `*Ended` event has no `cancelReason`); an edge draw started from a port, or a relink, is cancelled (`reason: 'cancelled'`). A programmatic draw is not (see Edge cases).
- In one two-finger gesture, a pinch replaces the pan as soon as the finger distance changes by more than 40 px, and the pan does not come back until the fingers lift.
- Resize, rotate and drawing from a port block the long-press box selection.
- The long-press timer runs for every one-finger touch in the diagram, also on a node. Unless the finger moves more than 10 px within 400 ms, box selection starts and ends the node drag, so move right away to drag a node.

## On-screen editing toolbar

Render the toolbar inside the component that declares `provideNgDiagram()`, so it gets the same service instances as the diagram (see `ng-diagram-setup`).

```ts
import { Component, computed, inject } from '@angular/core';
import {
  NgDiagramClipboardService,
  NgDiagramModelService,
  NgDiagramSelectionService,
  NgDiagramViewportService,
} from 'ng-diagram';

@Component({
  selector: 'app-touch-toolbar',
  template: `
    <button (click)="copy()" [disabled]="!hasSelection()">Copy</button>
    <button (click)="cut()" [disabled]="!hasSelection()">Cut</button>
    <button (click)="paste()">Paste</button>
    <button (click)="remove()" [disabled]="!hasSelection()">Delete</button>
    <button (click)="undo()">Undo</button>
    <button (click)="redo()">Redo</button>
  `,
})
export class TouchToolbarComponent {
  private readonly clipboard = inject(NgDiagramClipboardService);
  private readonly selection = inject(NgDiagramSelectionService);
  private readonly viewport = inject(NgDiagramViewportService);
  private readonly model = inject(NgDiagramModelService);

  readonly hasSelection = computed(() => {
    const { nodes, edges } = this.selection.selection();
    return nodes.length + edges.length > 0;
  });

  copy() {
    void this.clipboard.copy();
  }

  cut() {
    void this.clipboard.cut();
  }

  // No cursor on touch: paste at the center of the visible area.
  paste() {
    const { x, y, scale, width = 0, height = 0 } = this.viewport.viewport();
    void this.clipboard.paste({ x: (width / 2 - x) / scale, y: (height / 2 - y) / scale });
  }

  remove() {
    void this.selection.deleteSelection();
  }

  // The default model only logs a warning; undo/redo need a custom ModelAdapter.
  undo() {
    this.model.getModel().undo();
  }

  redo() {
    this.model.getModel().redo();
  }
}
```

`paste(position)` places the content at `position` (flow coordinates): one node is centered on it, several nodes land about half a node right and down of it (exact rule in `ng-diagram-selection-clipboard`). For undo/redo, implement `undo()`/`redo()` in a custom `ModelAdapter` (see `ng-diagram-persistence`). To add nodes to the selection from your own UI, pass the full list: `select(ids)` replaces the current selection.

## Connect button (programmatic linking)

Port dots are small for a finger. A "Connect" button starts a draw from the selected node; the user then puts a finger on empty canvas, slides to the target port and lifts. A touch that starts on a node also selects and drags that node.

```ts
import { Component, computed, inject } from '@angular/core';
import { NgDiagramSelectionService, NgDiagramService, type EdgeDrawEndedEvent } from 'ng-diagram';

@Component({
  selector: 'app-connect-button',
  template: `
    <button (click)="connect()" [disabled]="!source()">Connect</button>
    <button (pointerdown)="cancel()">Cancel</button>
  `,
})
export class ConnectButtonComponent {
  private readonly diagram = inject(NgDiagramService);
  private readonly selection = inject(NgDiagramSelectionService);

  readonly source = computed(() => this.selection.selection().nodes[0]);

  // Call it from (click): the draw ends on the next finger lift (or mouse click).
  connect() {
    const node = this.source();
    if (node) {
      // 'port-right' is a port of the default node; use a 'source' or 'both' port, or omit it for a floating edge.
      this.diagram.startLinking(node, 'port-right');
    }
  }

  // (pointerdown), not (click): it runs before the lift or click that would end the draw.
  cancel() {
    void this.diagram.cancelActiveInteraction(); // the draw ends with reason 'cancelled'
  }
}

// In the component that renders <ng-diagram (edgeDrawEnded)="onEdgeDrawEnded($event)" />
onEdgeDrawEnded(event: EdgeDrawEndedEvent) {
  if (event.success) {
    return;
  }
  // 'noTarget': lifted away from a port. 'cancelled': a second finger took over,
  // the browser cancelled the touch, or cancelActiveInteraction() ran.
  console.log('draw ended without an edge:', event.reason);
}
```

- After `startLinking(node, portId?)`, the edge follows the next one-finger move. The lift ends the draw: over a port that accepts the edge it connects; anywhere else it ends with `reason: 'noTarget'`, or, with `danglingEdges.enabled`, keeps a dangling edge (see `ng-diagram-dangling-edges`).
- The target is the port nearest to the last finger position, so a tap without moving connects nothing. The finger has to move onto the port.
- `startLinking` is ignored (with a console warning) while another draw or relink is active, or when the node is missing or hidden. A port of type `'target'`, a hidden port, or a port id the node does not have is refused silently (no warning, no `edgeDrawEnded`).
- `startLinkingFromPosition(position)` (since 1.4.0) draws from a canvas point the same way and needs `danglingEdges.enabled`.
- `edgeDrawEnded` exists since 1.2.0 and its `'cancelled'` reason since 1.3.0.

## Finger-friendly targets

Default targets are small for a finger. A default port and a resize corner have fixed invisible hit circles of 18 px and 16 px; the size variables grow the visible shape, and the target grows only when that shape is bigger than the circle. Both live inside the diagram, so they also shrink when the user zooms out. Relink handles always have a 24 px grab circle on screen. For targets of about 32 px at zoom 1, and a draw that snaps to ports from further away:

```css
/* In the styles of the component that renders <ng-diagram>, or globally */
ng-diagram {
  --ngd-port-size: 1.75rem; /* 28 px + 2 × 2 px border; default 0.25rem */
  --ngd-resize-handle-size: 1.875rem; /* 30 px + 2 × 1 px border; default 0.375rem */
  --ngd-relink-handle-size: 2rem; /* above the 24 px grab circle; default 0.75rem */
}
```

```ts
import type { NgDiagramConfig } from 'ng-diagram';

export const config: NgDiagramConfig = {
  linking: { portSnapDistance: 24 }, // default 10, in diagram units from the port's box
};
```

These values also make the shapes big. For a big target with a small look, use custom port content (see `ng-diagram-ports`); for theming, `ng-diagram-styling`.

## Edge cases

- There is no `stopLinking` method, although the 1.0.0 changelog lists one; no release exports it. To abort a draw from code, call `cancelActiveInteraction()` (since 1.3.0, returns `Promise<boolean>`). It is refused with a console warning while a transaction is active.
- During a programmatic draw on touch, the next lift anywhere on the page ends the draw, and that touch produces no `click` (the library cancels the `touchend`). A "Cancel" button tapped mid-draw therefore only ends the draw (as `noTarget`, or as a dangling edge when dangling edges are on). Use `(pointerdown)` with `cancelActiveInteraction()` for a Cancel button (recipe above). A two-finger pan or pinch does not cancel a programmatic draw; the draw ends when a finger lifts. Pan and zoom before tapping "Connect".
- A swipe that starts on the diagram never scrolls the page (`touch-action: none`). On a phone, leave some page area outside the diagram, or size the diagram to the screen.
- A swipe that starts on a palette item starts a palette drag and does not scroll the palette list (the item cancels its `touchstart`). The preview drag image is built only for HTML5 drags (`dragstart`); the touch path just drops the node where the finger lifts.
- The library has no double-tap gesture and no long-press menu. If you add your own long-press handling, remember that holding still for 400 ms starts box selection.
- No config flag turns pinch zoom off; it is only clamped by `zoom.min`/`zoom.max`. `viewportPanningEnabled: false` turns off two-finger pan (and desktop pan).
- Laptop trackpads send wheel events, not touch events: a two-finger scroll pans and a pinch zooms (since 1.2.4 a pinch zooms whatever the `zoom` shortcut binding is); `Shift` + scroll pans sideways. See `ng-diagram-viewport` and `ng-diagram-shortcuts`.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| Box selection "does not work" on a tablet | Hold still on the canvas for 400 ms (moving 10 px or less), then drag. `Shift`+drag is desktop only. |
| Swiping empty canvas with one finger does nothing | By design. Pan with two fingers. |
| Holding a node and then moving draws a selection box instead of dragging | The 400 ms long press switched to box selection. Move the finger more than 10 px within the first 400 ms. |
| Text fields or dropdowns inside nodes do not respond on iPhone/iPad | Fixed in 1.2.2 - upgrade. |
| Touching an input inside a node drags the node | Add `data-no-drag="true"` to the element (the value must be `"true"`). |
| Two-finger pan does nothing | `viewportPanningEnabled` is `false`, or the touch started on a `data-no-pan="true"` element. |
| Pinch does nothing at first, or stops at some zoom level | The fingers must spread or close by more than 40 px first; the zoom is clamped to `zoom.min`/`zoom.max`. |
| Pinch zoom lags behind the fingers | Each touch move changes the zoom by at most `zoom.step` (default 0.03). Raise it; it is also the wheel and keyboard zoom step. |
| An edge connects to a port the user never touched after a two-finger pan mid-draw | Fixed in 1.3.0 - upgrade. The draw is now cancelled with `reason: 'cancelled'`. |
| The diagram stays in drawing mode after a palm touch or a system gesture | Fixed in 1.4.0 - upgrade. The draw is now cancelled. |
| With virtualization, a stray touch during pan or pinch starts a drag, resize or link | Fixed in 1.3.0 - upgrade. |
| Hard to hit ports or handles with a finger | Raise `linking.portSnapDistance` and the size variables in "Finger-friendly targets". |
| `stopLinking is not a function` / not in the typings | It does not exist. Let the lift end the draw, or call `cancelActiveInteraction()` (since 1.3.0). |
| `[ngDiagram] startLinking ignored: another linking or relinking gesture is in progress.` | A draw or relink is still active. Wait for `edgeDrawEnded`/`edgeRelinkEnded`, or cancel it first. |
| `[ngDiagram] startLinking ignored: source node "…" is missing or effectively hidden.` | The node was deleted or is hidden. Re-read the selection before calling. |
| `[ngDiagram] startLinkingFromPosition ignored: dangling edges are disabled. …` | Set `danglingEdges.enabled: true` (see `ng-diagram-dangling-edges`). |
| "Cancel" button does nothing while the user draws an edge | The lift (or mouse click) on the button ended the draw before `(click)` ran. Bind the button to `(pointerdown)` and call `cancelActiveInteraction()`: it runs before that lift, so the draw ends with `reason: 'cancelled'` and no dangling edge. |
| Undo/Redo buttons only log `Undo is not implemented in the current model…` | The default model has no history. Implement a custom `ModelAdapter` (see `ng-diagram-persistence`). |
| The palette list cannot be scrolled by touch | Swipes that start on an item start a drag. Leave gaps between items or add a scroll area that is not an item. |
| No drag preview under the finger when dragging from the palette | Expected: the touch path shows no drag image; the preview image is built only for HTML5 drags. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
