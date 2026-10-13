---
name: ng-diagram-shortcuts
description: Use when changing ng-diagram keyboard shortcuts (configureShortcuts, defaults, Escape and cancelActiveInteraction, arrow keys move vs pan), focus and Tab order, or when a shortcut does not fire or keys typed in a node act on the diagram.
license: Apache-2.0
---

# Keyboard shortcuts

Covers the shortcut system of `<ng-diagram>`: `configureShortcuts`, default bindings, key matching, Escape and `cancelActiveInteraction()`, arrow keys, focus and Tab order. What the selection and clipboard actions do is in `ng-diagram-selection-clipboard`; touch input is in `ng-diagram-touch`.

## Rules

- Build `shortcuts` with `configureShortcuts(custom, base?)`. Config arrays are not merged: a plain `shortcuts: [...]` replaces the whole default list, so every action you leave out loses its keys.
- `configureShortcuts` merges by `actionName`. For each action you pass, your `bindings` replace all of its bindings, so repeat the defaults you want to keep. `bindings: []` turns the action off.
- Use `modifiers: { primary: true }` for Ctrl (Windows/Linux) and Cmd (macOS). Modifiers match exactly: a Ctrl+C binding does not fire on Ctrl+Shift+C. `meta` is compared only when you set it.
- `key` is a `KeyboardEvent.key` value. One-character keys match in any case (`'z'` also matches `'Z'`); names like `'ArrowUp'`, `'Delete'`, `'Escape'` must match exactly.
- The `[config]` input is read only when the model initializes. Change shortcuts later with `NgDiagramService.updateConfig({ shortcuts })`, built on the current list.
- Shortcuts run only while focus is inside `<ng-diagram>`, and never for keys typed into an `input`, `textarea`, `select` or `contenteditable` element.
- `boxSelection`, `multiSelection` (pointer) and `zoom` (wheel) take modifier-only bindings; TypeScript rejects a `key` on them. Unknown action names are a type error: there are no custom actions, so handle app shortcuts yourself (see "Focus, Tab order and app shortcuts").

## Default bindings

| Action | Default (`primary` = Ctrl, Cmd on macOS) |
| --- | --- |
| `copy` / `cut` / `paste` | primary + C / X / V |
| `selectAll` | primary + A |
| `deleteSelection` | Delete or Backspace |
| `cancelInteraction` (since 1.3.0) | Escape |
| `keyboardMoveSelectionUp/Down/Left/Right` | arrow keys, when the selection can move |
| `keyboardPanUp/Down/Left/Right` | arrow keys, when it cannot |
| `keyboardZoomIn` / `keyboardZoomOut` (since 1.1.0) | `=` / `-` |
| `undo` / `redo` | primary + Z / primary + Y (need a custom `ModelAdapter`) |
| `boxSelection` | Shift held while pressing and dragging |
| `multiSelection` | primary held while clicking |
| `zoom` (since 1.1.0) | primary held while turning the mouse wheel |

Read `references/default-shortcuts.md` when you need what each action does exactly (step sizes, paste position, hidden elements), the modifier keys per OS, or the full matching rules.

## Override, extend, disable

```ts
import { configureShortcuts, type NgDiagramConfig } from 'ng-diagram';

// in the component that renders <ng-diagram [model]="model" [config]="config" />
config = {
  shortcuts: configureShortcuts([
    // Override: paste with Ctrl/Cmd+B instead of Ctrl/Cmd+V
    { actionName: 'paste', bindings: [{ key: 'b', modifiers: { primary: true } }] },
    // Extend: keep ArrowUp and add W (list every binding you want to keep)
    { actionName: 'keyboardMoveSelectionUp', bindings: [{ key: 'ArrowUp' }, { key: 'w' }] },
    // Extra binding: redo with Ctrl/Cmd+Shift+Z as well as Ctrl/Cmd+Y
    {
      actionName: 'redo',
      bindings: [
        { key: 'y', modifiers: { primary: true } },
        { key: 'z', modifiers: { primary: true, shift: true } },
      ],
    },
    // Disable: an empty list removes every binding of the action
    { actionName: 'deleteSelection', bindings: [] },
    // Pointer modifier: box selection with Alt+drag instead of Shift+drag
    { actionName: 'boxSelection', bindings: [{ modifiers: { secondary: true } }] },
  ]),
} satisfies NgDiagramConfig;
```

For a view-only diagram, `{ shortcuts: [] }` removes every binding at once (Ctrl + wheel and trackpad pinch still zoom).

## Change shortcuts at runtime

```ts
import { Component, inject, signal } from '@angular/core';
import { NgDiagramService, configureShortcuts, type ShortcutActionName, type ShortcutDefinition } from 'ng-diagram';

const EDIT_ACTIONS: ShortcutActionName[] = [
  'cut', 'paste', 'deleteSelection',
  'keyboardMoveSelectionUp', 'keyboardMoveSelectionDown', 'keyboardMoveSelectionLeft', 'keyboardMoveSelectionRight',
];

@Component({
  selector: 'app-edit-mode-toggle',
  template: `<button (click)="toggle()">{{ readOnly() ? 'Edit' : 'Read only' }}</button>`,
})
export class EditModeToggleComponent {
  private readonly diagram = inject(NgDiagramService);
  readonly readOnly = signal(false);
  private saved: ShortcutDefinition[] | null = null;

  toggle(): void {
    // config() holds the full, merged list; its type is DeepPartial, hence the cast
    const current = this.diagram.config().shortcuts as ShortcutDefinition[];
    if (this.saved) {
      this.diagram.updateConfig({ shortcuts: this.saved }); // restore
      this.saved = null;
    } else {
      this.saved = current;
      const disabled = EDIT_ACTIONS.map((actionName) => ({ actionName, bindings: [] }));
      this.diagram.updateConfig({ shortcuts: configureShortcuts(disabled, current) });
    }
    this.readOnly.set(this.saved !== null);
  }
}
```

- A change applies from the next key press. Without the base argument, `configureShortcuts` starts from the defaults and drops your earlier changes; without the cast, strict TypeScript rejects `config().shortcuts`.
- Replacing the model (`[model]` bound to a new adapter) rebuilds the engine from `[config]` and drops changes made with `updateConfig`. Re-apply them after `(diagramInit)`, or keep the object bound to `[config]` up to date too.
- This only turns off keys. With the move actions unbound, arrow keys do nothing while a movable node is selected, so in read-only mode also call `this.diagram.updateConfig({ nodeDraggingEnabled: false })`: it blocks dragging and makes the arrow keys pan. For a real read-only diagram (no linking, no other edits), block changes in a middleware — see `ng-diagram-middleware`.

## Escape and cancelActiveInteraction()

Escape runs the `cancelInteraction` action (since 1.3.0), which calls `NgDiagramService.cancelActiveInteraction()`:

- It aborts edge drawing (also a draw started with `startLinking`), relinking, node drag, resize, rotation and viewport panning. Nodes get back the position, size and angle they had before the gesture, and the temporary edge is removed. The viewport is not rolled back. Box selection is not cancelled.
- The gesture's end event still fires, marked as cancelled: `cancelReason: 'cancelled'` on `nodeDragEnded` / `nodeResizeEnded` / `nodeRotateEnded`, `reason: 'cancelled'` on `edgeDrawEnded` / `edgeRelinkEnded` (payloads: `ng-diagram-events`).
- When nothing can be cancelled, the diagram leaves Escape alone, so it still closes your dialog or menu.
- Add a second key with `{ actionName: 'cancelInteraction', bindings: [{ key: 'Escape' }, { key: 'q' }] }`.

Call it from your own code as well:

```ts
private readonly diagram = inject(NgDiagramService);

// For example before your app opens a modal dialog
async stopCurrentGesture(): Promise<void> {
  const cancelled = await this.diagram.cancelActiveInteraction();
  // false: nothing to cancel, or refused because a transaction is running (console warning)
  console.log(cancelled ? 'Gesture cancelled' : 'Nothing cancelled');
}
```

While a transaction runs, it logs `[ngDiagram] cancelActiveInteraction() called while a transaction is active — ignored. …` and returns `false`; await the transaction, then cancel.

## Arrow keys: move or pan

Each arrow key is bound to a move action and a pan action, and only one of them runs:

- The selection moves when `nodeDraggingEnabled` is `true` and at least one selected node is visible and not `draggable: false`. A press moves by the drag snap step (`snapping.defaultDragSnap`, 10 px by default, or `computeSnapForNodeDrag`), even when drag snapping is off.
- Otherwise the viewport pans 10 px per press, if `viewportPanningEnabled` is `true`. Since 1.4.0; before, the arrow keys did nothing while the selected nodes could not move.
- Keyboard moves fire `selectionMoved`, not `nodeDragStarted` / `nodeDragEnded`.
- If you add letter keys for moving (WASD), add them to the `keyboardPan*` actions too, or they do nothing when nothing can move.

## Focus, Tab order and app shortcuts

The key listener is on `document`, but it acts only while focus is inside this `<ng-diagram>` (with several diagrams, only the focused one reacts). The diagram focuses itself on every pointer press inside it (since 1.3.0 also when the press lands on a resize or rotate handle). The diagram and its watermark link are Tab stops.

- `[tabbable]="false"` (since 1.4.0) removes both Tab stops, for example when your app runs a roving tabindex over the nodes. Clicks still focus the diagram and shortcuts keep working. A `tabindex` attribute on `<ng-diagram>` has no effect; use `[tabbable]`.
- The diagram host has `outline: none`. If keyboard users must see focus, add for example `ng-diagram:focus-visible { outline: 2px solid #2563eb; outline-offset: -2px; }`.
- A click on your own toolbar moves focus out of the diagram, and shortcuts (Escape too) stop until the next press inside. Give focus back after the action.
- For keys ng-diagram has no action for, listen to `keydown` on an element around `<ng-diagram>`: key events bubble through it while the diagram has focus.

```ts
import { Component, ElementRef, inject, viewChild } from '@angular/core';
import {
  NgDiagramComponent, NgDiagramSelectionService, NgDiagramViewportService, initializeModel, provideNgDiagram,
} from 'ng-diagram';

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `
    <button (click)="deleteSelected()">Delete</button>
    <div class="canvas" (keydown)="onKeyDown($event)">
      <ng-diagram [model]="model" />
    </div>
  `,
})
export class EditorComponent {
  private readonly viewport = inject(NgDiagramViewportService);
  private readonly selection = inject(NgDiagramSelectionService);
  private readonly diagramHost = viewChild.required(NgDiagramComponent, { read: ElementRef });
  model = initializeModel({});

  // App shortcut: F fits the view. Keydown bubbles here only while focus is inside the diagram.
  onKeyDown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const typing = target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      void this.viewport.zoomToFit();
    }
  }

  // A toolbar click moves focus to the button; give it back so shortcuts keep working.
  deleteSelected(): void {
    void this.selection.deleteSelection();
    (this.diagramHost().nativeElement as HTMLElement).focus();
  }
}
```

## Edge cases

- Keys typed into a native `input`, `textarea`, `select` or a `contenteditable` element inside a node are ignored by the diagram. A custom widget built from other elements (for example a `div` dropdown that uses arrow keys) is not detected: stop its keys with `(keydown)="$event.stopPropagation()"` on the widget, so they never reach the document listener.
- When a shortcut matches, the browser default is prevented: Ctrl/Cmd + A does not select page text, Ctrl/Cmd + C copies diagram elements to an internal clipboard (not the system clipboard), and arrow keys do not scroll the page.
- A press with the `boxSelection` modifiers starts a selection box anywhere in the diagram, also on a node. So Shift + click on a node does not add it to the selection; that is Ctrl/Cmd + click (`multiSelection`). Keep the two on different modifiers.
- `zoom` sets the modifier that turns the wheel into zoom. A wheel event with the Ctrl key (also a trackpad pinch) always zooms, even if you rebind or disable `zoom`.
- A key bound to two actions runs both, in list order.
- Keyboard paste puts the content at the mouse pointer if the mouse moved in the last 5 seconds, even when the pointer is outside the diagram; otherwise 20 px from the copied position.
- `selectAll`, `deleteSelection` and `copy` skip effectively hidden elements (since 1.4.0); see `ng-diagram-visibility`.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| No shortcut works | Focus is outside the diagram, for example on your toolbar button. The user clicks the diagram, or you call `focus()` on the `<ng-diagram>` element after toolbar actions. |
| A custom binding never fires | Check exact modifiers (Shift held but not in the binding?), the key name spelling (`'ArrowUp'`, not `'arrowup'`), and that focus is in the diagram, not in an input. |
| All other shortcuts stopped after customizing | `shortcuts` is a plain array. Wrap it in `configureShortcuts(...)`. |
| A default key of an action is gone | Your `bindings` replace all bindings of that action. List the default too, e.g. `[{ key: 'ArrowUp' }, { key: 'w' }]`. |
| `updateConfig({ shortcuts })` undid earlier runtime changes | Build on the live list: `configureShortcuts(custom, diagram.config().shortcuts as ShortcutDefinition[])`. |
| Changing the object bound to `[config]` does not change shortcuts | `[config]` is read only at model init. Use `updateConfig`. |
| Runtime shortcut changes are gone | The model was replaced, which rebuilds the engine from `[config]`. Re-apply after `(diagramInit)`. |
| Ctrl/Cmd+Z logs `Undo is not implemented in the current model. Please implement a custom ModelAdapter to support undo functionality.` | The default model has no history. Implement `undo()`/`redo()` in a custom `ModelAdapter` (see `ng-diagram-persistence`) or disable the bindings. |
| Works on Windows, not on macOS | Use `primary`, not a fixed Ctrl. On macOS `primary` is Cmd, and the Control key is not reported as a modifier. |
| `=` / `-` zoom keys do nothing on some keyboard layouts (where the key needs Shift) | Bindings compare `event.key` and the exact Shift state. Add a binding with the `key` and `shift` value the browser reports for that key. |
| `=` / `-` zoom does not stay centered, the view drifts | In 1.4.0 the keyboard zoom keeps the center fixed only when `<ng-diagram>` sits at the page's top-left. Workaround: unbind `keyboardZoomIn`/`keyboardZoomOut` and in your own key handler call `viewportService.setViewport(cx - (cx - x) * f, cy - (cy - y) * f, scale * f)`, with `{ x, y, scale, width, height }` from `viewportService.viewport()`, `cx = width / 2`, `cy = height / 2` and zoom factor `f`. |
| Ctrl/Cmd + C/V/A/Z do nothing with a non-Latin keyboard layout (Cyrillic, Greek, …) | Bindings compare `event.key`, the character the active layout produces, not the physical key. Add a binding for that character too, for example `{ key: 'с', modifiers: { primary: true } }` (Cyrillic) next to `'c'` for `copy`. |
| Arrow keys or Delete act on the diagram while the user works a dropdown inside a node | The widget is not a native form element. Stop `keydown` propagation in the widget. |
| Arrow keys do nothing with `nodeDraggingEnabled: false` and a node selected | Fixed in 1.4.0 (they pan now) — upgrade. |
| Shortcuts, even Escape, dead after starting a resize right after clicking a toolbar button | Fixed in 1.3.0 (the diagram takes focus on any pointer press inside it) — upgrade. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
