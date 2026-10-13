---
name: ng-diagram-selection-clipboard
description: Use when handling ng-diagram selection or clipboard - select/deselect, a properties panel, a context menu, box selection, Ctrl/Cmd multi-select, copy/cut/paste of nodes, groups and edges, or pasted content with a wrong position, edges or ids.
license: Apache-2.0
---

# Selection, clipboard and context menus

Covers reading and changing the selection, the built-in selection gestures, box selection, properties panels, context menus, and copy/cut/paste. Key bindings are in `ng-diagram-shortcuts`, touch gestures in `ng-diagram-touch`, event details in `ng-diagram-events`, selected-state styling in `ng-diagram-styling`.

## Rules

- **Selection lives on the elements** (`node.selected`, `edge.selected`). Read it with `NgDiagramSelectionService.selection()` (`{ nodes, edges }`). Change it with `select`, `deselect`, `deselectAll`, `deleteSelection` — not by writing `selected` yourself. Every method returns a Promise (since 1.3.0); `await` it when the next line depends on the result.
- **`select(nodeIds, edgeIds)` replaces the selection.** Everything not listed gets deselected. To add, pass the union. `deselect(ids)` removes only those ids; `select()` with no ids clears the selection.
- **`selection()` is a signal over `nodes()`/`edges()`.** It refreshes with change detection, so right after `await select(...)` or inside a diagram event handler, read the getters (`getModel().getNodes().filter((n) => n.selected)`) or the event payload.
- **Hidden elements (since 1.4.0).** Users cannot select them (no click, select-all or box selection), but `select()` can, and hiding does not deselect. `selection()` still lists hidden selected elements; `deleteSelection()`, `copy()`/`cut()`, drag and arrow keys skip them. Filter with `!n.computedHidden` when you build a selection yourself.
- **Edit through the model service.** `updateNodeData(id, data)` replaces `data` as a whole, so spread the old data. Never change `node.data` in place: an update with the same object reference is ignored.
- **The clipboard is internal and per diagram.** `copy()`/`cut()` store a snapshot in the diagram engine, not in the system clipboard. It is not shared between diagrams, and a new model starts with an empty clipboard. `paste(position)` takes diagram (flow) coordinates.

## Built-in gestures (default bindings)

| Gesture | Result |
| --- | --- |
| Click a node or edge | Selects only that element (on pointerdown) |
| Click an element that is already selected | Keeps the whole selection, so a multi-selection can be dragged |
| Ctrl/Cmd+click (`multiSelection`) | Adds or removes that element |
| Click empty canvas, or start a pan there | Clears the selection (not while Ctrl/Cmd is held) |
| Shift+drag (`boxSelection`) | Box selection; replaces the selection and also starts on top of nodes |
| Ctrl/Cmd+A (`selectAll`) | Selects all visible nodes and edges |
| Delete / Backspace (`deleteSelection`) | Deletes the visible selection; a deleted group takes its content with it |
| Right-click | Nothing: select the element in your `contextmenu` handler |

Ctrl on Windows/Linux, Cmd on macOS. Modifiers match exactly, so Ctrl+Shift+drag is neither box nor multi selection. Rebind in `ng-diagram-shortcuts`; on touch, box selection is a long press (`ng-diagram-touch`).

## Selection toolbar

```ts
readonly hasSelection = computed(() => {
  const { nodes, edges } = this.selectionService.selection();
  return nodes.length + edges.length > 0;
});

async addToSelection(nodeId: string) {
  const { nodes, edges } = this.selectionService.selection();
  // select() replaces the selection, so pass everything that should stay selected
  await this.selectionService.select([...nodes.map((n) => n.id), nodeId], edges.map((e) => e.id));
}

selectAllVisible() {
  const model = this.modelService.getModel();
  return this.selectionService.select(
    model.getNodes().filter((n) => !n.computedHidden).map((n) => n.id),
    model.getEdges().filter((e) => !e.computedHidden).map((e) => e.id)
  );
}

async pasteAtCenter() {
  const { x, y, scale, width = 0, height = 0 } = this.viewportService.viewport();
  await this.clipboard.paste({ x: (width / 2 - x) / scale, y: (height / 2 - y) / scale }); // flow coordinates
}
```

Inject `NgDiagramSelectionService`, `NgDiagramClipboardService`, `NgDiagramModelService` and `NgDiagramViewportService` in any component under the same `provideNgDiagram()`.

To show a floating toolbar only after the user has finished selecting (not on pointerdown or while a selection box grows), react to `(selectionGestureEnded)` instead of reading `selection()` live; the recipe is in `ng-diagram-events`.

## Properties panel

```ts
type TaskData = { label: string; priority: number };

@Component({
  selector: 'app-properties-panel',
  template: `
    @if (node(); as node) {
      <input [value]="node.data.label" (input)="setLabel(node, $any($event.target).value)" />
      <label>
        <input type="checkbox" [checked]="node.draggable === false" (change)="setLocked(node, $any($event.target).checked)" />
        Lock position
      </label>
    } @else {
      <p>Select one node to edit it.</p>
    }
  `,
})
export class PropertiesPanelComponent {
  private readonly selectionService = inject(NgDiagramSelectionService);
  private readonly modelService = inject(NgDiagramModelService);

  readonly node = computed(() => {
    const { nodes } = this.selectionService.selection();
    return nodes.length === 1 ? (nodes[0] as Node<TaskData>) : null;
  });

  setLabel(node: Node<TaskData>, label: string) {
    void this.modelService.updateNodeData(node.id, { ...node.data, label }); // data is replaced as a whole
  }

  setLocked(node: Node<TaskData>, locked: boolean) {
    void this.modelService.updateNode(node.id, { draggable: !locked }); // node-level property
  }
}
```

For edges use `updateEdgeData`/`updateEdge`; for several selected nodes, one `updateNodes([...])` call.

## Context menu

```ts
// In the node template component: <host (contextmenu)="openMenu($event)">
openMenu(event: MouseEvent) {
  event.stopPropagation(); // keep the canvas menu handler out
  this.menuState.open(event, true); // calls preventDefault(), so keep it before any await
  if (!this.node().selected) {
    void this.selectionService.select([this.node().id]); // right-click does not select by itself
  }
}

// ContextMenuState: remember where the menu goes and where to paste
open(event: MouseEvent, onNode: boolean) {
  event.preventDefault(); // no browser menu
  const client = { x: event.clientX, y: event.clientY };
  this.menu.set({
    ...this.viewportService.clientToFlowViewportPosition(client), // relative to <ng-diagram>'s top-left
    flow: this.viewportService.clientToFlowPosition(client), // diagram coordinates
    onNode,
  });
}
```

Menu actions call `clipboard.copy()`, `clipboard.cut()`, `selectionService.deleteSelection()` and `clipboard.paste(menu.flow)`. Place the menu absolutely inside a `position: relative` wrapper around `<ng-diagram>`. Read `references/context-menu.md` for the full wiring (state service, canvas menu, menu component, closing, "can paste" check).

## Box selection

```ts
config: NgDiagramConfig = {
  boxSelection: {
    partialInclusion: false, // default true: touching the box is enough
    realtime: false, // default true: selection updates while the box is drawn
  },
};

// at runtime
setPartialInclusion(enabled: boolean): void {
  this.diagram.updateConfig({ boxSelection: { partialInclusion: enabled } });
}
```

```css
.editor {
  --ngd-box-selection-border-color: #2563eb;
  --ngd-box-selection-border-size: 2px;
  --ngd-box-selection-background: rgb(37 99 235 / 0.1);
}
```

An edge is box-selected when both ends are inside: an attached end counts when its node is selected by the box; a free end of a dangling edge counts when its anchor point is inside the box (since 1.4.0). Hidden elements are never box-selected. With `realtime: true`, `selectionChanged` fires during the drag each time the box content changes; drive UI from `selectionGestureEnded`.

## Copy, cut and paste

`copy()` takes:
- the visible selected nodes and all their descendants, including the hidden children of a collapsed group (since 1.4.0);
- the visible selected edges, plus every edge between two copied nodes (since 1.4.0). With `danglingEdges.enabled`, an edge with one free end travels with its node.

`paste(position, options?)` creates:
- new ids from the `computeNodeId`/`computeEdgeId` config functions (see `ng-diagram-config`). Everything else, including `data`, is copied as it is;
- `groupId` pointing to the pasted copy of the group; a node pasted without its group is ungrouped;
- edges: an end whose node was copied connects to the new node. An end whose node was not copied becomes a free end (`source`/`target` is `''`, the position is in `sourcePosition`/`targetPosition`) at its old place, moved with the paste — also when `danglingEdges.enabled` is `false` (since 1.4.0). Code that expects two nodes on every edge must handle it; reconnect with `attachEdge` (see `ng-diagram-dangling-edges`). An edge whose free end has no known position (never routed) is not pasted. Edges with `routingMode: 'manual'` keep their shape (since 1.4.0);
- placement: a single visible node with no free edge ends is centered on `position`; otherwise the average of the visible nodes' top-left corners and the free edge ends lands on `position`, so the content sits about half a node right and down of it. Positions snap when `snapping.shouldSnapDragForNode` returns `true` (since 1.2.0);
- selection: the old selection is cleared and the pasted visible content is selected. Pasted hidden content stays unselected (since 1.4.0).

`cut()` is `copy()` plus `deleteSelection()` (it fires `selectionRemoved`); cutting a collapsed group keeps its hidden children for the paste. A paste fires `selectionChanged`, `clipboardPasted { nodes, edges }`, then `selectionGestureEnded`. `paste(position, { waitForMeasurements: true })` (since 1.3.0) resolves after the pasted elements are measured, for example before `zoomToFit()`.

Data is copied as it is, so business ids inside `data` get duplicated. Fix them after the paste:

```ts
// <ng-diagram (clipboardPasted)="onPasted($event)" />
onPasted({ nodes }: ClipboardPastedEvent) {
  // ids are new, but data is copied as is: give pasted nodes their own business ids
  // (crypto.randomUUID needs HTTPS or localhost; use your own id helper otherwise)
  void this.modelService.updateNodes(nodes.map(({ id, data }) => ({ id, data: { ...data, externalId: crypto.randomUUID() } })));
}
```

## Edge cases

- Ctrl/Cmd+V pastes at the last mouse position if the mouse moved in the last 5 seconds, even when the mouse was outside the diagram. Otherwise it pastes 20 px right and down from the copied elements, so repeated pastes stack on the same spot.
- The clipboard holds the snapshot from copy time: later edits to the originals are not pasted, and deleted originals can still be pasted. `copy()` with nothing selected empties it.
- `initializeModel()` and `toJSON()` drop `selected` from nodes, so a saved node selection does not come back. Call `select()` after `diagramInit`.
- Pressing a port also selects its node, unless `linking.selectNodeOnPortPress` is `false` (since 1.2.0).

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `select([id])` dropped the rest of the selection | `select` replaces the selection. Pass the union of old and new ids. |
| Panel shows the previous selection right after `await select()` or in an event handler | Signals refresh with change detection. Read the getters or the event payload. |
| Editing one field wiped the other `data` fields | `updateNodeData` replaces `data`. Spread `...node.data`. |
| `node.data.label = ...` changes nothing | In-place changes are not seen. Call `updateNodeData` with a new object. |
| Browser menu appears over the custom context menu | `preventDefault()` ran after an `await`. Call it first, synchronously. |
| Right-click actions hit the wrong node | Right-click does not select. Select the node in the `contextmenu` handler. |
| Menu misplaced when zoomed or panned | Place the menu with `clientToFlowViewportPosition`; use `clientToFlowPosition` only for paste. |
| Pasted content lands far away | `paste()` takes flow coordinates; convert with `clientToFlowPosition`. Ctrl/Cmd+V uses the last mouse position on the page. |
| Shift+press on a node starts a box instead of selecting it | Box selection wins while Shift is held. Rebind `boxSelection` in `ng-diagram-shortcuts` if needed. |
| A hidden node still shows in `selection()` | Hiding does not deselect. Filter `!n.computedHidden` or `deselect` it. |
| A pasted edge has `source: ''` and hangs free | Its node was not copied. Since 1.4.0 such ends are pasted free, with or without `danglingEdges`. Copy the nodes too, or reconnect with `attachEdge`. |
| Pasted group is empty, or a pasted edge duplicates the original connection | Fixed in 1.4.0 — upgrade. |
| Pasted manual-routing edge is drawn at the old place | Fixed in 1.4.0 — upgrade. |
| Pasted nodes ignore drag snapping | Fixed in 1.2.0 — upgrade; `shouldSnapDragForNode` must return `true`. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
