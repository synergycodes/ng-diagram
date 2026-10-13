---
name: ng-diagram-palette
description: Use when building an ng-diagram drag-and-drop palette, stencil or toolbox (ng-diagram-palette-item, its preview, paletteItemDropped), or when drops misbehave - wrong spot, size or template, odd drag image, no snapping, "Invalid drop data".
license: Apache-2.0
---

# Drag-and-Drop Palette

How to build a palette (stencil, toolbox) that creates ng-diagram nodes by drag and drop, and how a drop behaves. Node templates and sizing live in `ng-diagram-custom-nodes`, groups in `ng-diagram-groups`, snapping details in `ng-diagram-resize-rotate-snap`, all events in `ng-diagram-events`.

## Rules

- Wrap any content in `<ng-diagram-palette-item [item]="item">` (`item` is required). The palette does not have to be inside `<ng-diagram>`, but it must be inside the component that has `providers: [provideNgDiagram()]` (or one of its children). Outside that scope Angular throws a `NullInjectorError`, because the palette uses ng-diagram services.
- `NgDiagramPaletteItem` is a node definition: `type`, `data`, `size`, `autoSize`, `resizable`, `rotatable`, `angle`, `zOrder`, plus `isGroup: true` for a group. It has no `id` and no `position`: each drop gets a new id from `config.computeNodeId()` and puts the node's top-left corner at the drop point.
- Item `data` is `BasePaletteItemData` (`{ label: string }`) by default, and the `[item]` input expects that type. For your own data, extend it (`interface TaskData extends BasePaletteItemData`) and use `NgDiagramPaletteItem<TaskData>`.
- Keep `data` JSON-safe (plain objects, strings, numbers, arrays). A mouse drag carries the item to the diagram as JSON text, so functions, class instances, `Date` or `Map` values do not arrive as they were.
- For a fixed dropped size set both `size` and `autoSize: false`. With the default `autoSize`, the node takes its size from the rendered content and `size` is replaced.
- Put `<ng-diagram-palette-item-preview>` inside the palette item, in the same template. Its content becomes the drag image. It takes no space in the layout (since 1.4.0) and stays rendered off-screen, because it is copied at drag start: do not show its content only while dragging (no `@if` on a drag state).
- Ports and the resize/rotate handles render only inside the diagram, so they never show in a palette item or preview. This is by design.
- A drop does not select the new node and does not add it to a group under the pointer. Do that in `(paletteItemDropped)`.

## Basic palette

```ts
import { Component, input } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramPaletteItemComponent,
  NgDiagramPaletteItemPreviewComponent,
  provideNgDiagram,
  type NgDiagramPaletteItem,
} from 'ng-diagram';

@Component({
  selector: 'app-palette',
  imports: [NgDiagramPaletteItemComponent, NgDiagramPaletteItemPreviewComponent],
  template: `
    @for (item of items(); track $index) {
      <ng-diagram-palette-item [item]="item">
        <div class="palette-card">{{ item.data.label }}</div>
        <ng-diagram-palette-item-preview>
          <div class="node-look" [style.width.px]="item.size?.width" [style.height.px]="item.size?.height">
            {{ item.data.label }}
          </div>
        </ng-diagram-palette-item-preview>
      </ng-diagram-palette-item>
    }
  `,
})
export class PaletteComponent {
  items = input.required<NgDiagramPaletteItem[]>();
}

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent, PaletteComponent],
  providers: [provideNgDiagram()], // the palette and the diagram share this injector scope
  template: `
    <app-palette [items]="paletteItems" />
    <div class="canvas"><ng-diagram [model]="model" /></div>
  `,
})
export class EditorComponent {
  model = initializeModel();
  paletteItems: NgDiagramPaletteItem[] = [
    { data: { label: 'Task' }, size: { width: 180, height: 48 }, autoSize: false },
    { type: 'decision', data: { label: 'Decision' }, resizable: true },
    { isGroup: true, data: { label: 'Group' }, size: { width: 300, height: 200 }, autoSize: false },
  ];
}
```

`type` must match a key of the `[nodeTemplateMap]` on `<ng-diagram>`; without `type` you get the default node, or the default group with `isGroup: true`.

## Make the drag image match the node

The drag image is the preview content scaled to the current zoom, at most 3x (since 1.4.0; the dropped node still uses the real zoom). Its top-left corner hangs from the cursor, and the node lands the same way. So a preview with the node's look and size (bind `item.size` as above) shows exactly what will be dropped. Without a preview, the browser shows its default drag image of the palette item.

Read `references/palette-recipes.md` when you need: a categorized or searchable palette, your node template component reused as the preview, a drag source outside the `provideNgDiagram()` scope, or a guard against file drops.

## React to a drop

```ts
import { Component, inject, signal } from '@angular/core';
import {
  initializeModel,
  NgDiagramComponent,
  NgDiagramGroupsService,
  NgDiagramModelService,
  NgDiagramSelectionService,
  provideNgDiagram,
  type GroupNode,
  type PaletteItemDroppedEvent,
} from 'ng-diagram';

@Component({
  selector: 'app-editor',
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" (paletteItemDropped)="onDropped($event)" />`,
})
export class EditorComponent {
  private readonly modelService = inject(NgDiagramModelService);
  private readonly groupsService = inject(NgDiagramGroupsService);
  private readonly selectionService = inject(NgDiagramSelectionService);

  model = initializeModel();
  editedNodeId = signal<string | null>(null); // drives a properties panel

  async onDropped({ node, dropPosition }: PaletteItemDroppedEvent) {
    // A drop never joins a group by itself: find the top-most visible group under the drop point.
    const group = this.modelService
      .getNodesInRange(dropPosition, 1)
      .filter((n): n is GroupNode => 'isGroup' in n && n.isGroup && n.id !== node.id && !n.computedHidden)
      .sort((a, b) => (b.computedZIndex ?? 0) - (a.computedZIndex ?? 0))[0];

    if (group) {
      await this.groupsService.addToGroup(group.id, [node.id]); // respects grouping.canGroup
    }
    await this.selectionService.select([node.id]); // the dropped node is not selected by default
    this.editedNodeId.set(node.id);
  }
}
```

The handler runs right after the node is added to the model, before it is rendered: with `autoSize`, `node.size` is not measured yet. Give items a fixed size if the handler needs it. The service calls are applied after the current update, and `await` waits for them (since 1.3.0).

## Snap drops, control IDs

```ts
config: NgDiagramConfig = {
  snapping: {
    shouldSnapDragForNode: () => true, // the same switch snaps dragging, arrow-key moves and paste
    defaultDragSnap: { width: 20, height: 20 },
  },
  background: { cellSize: { width: 20, height: 20 } }, // same step as the snap
  computeNodeId: () => `node-${uid()}`, // used for every dropped and pasted node
};
```

`uid()` is the id helper from `ng-diagram-config` (`crypto.randomUUID()` with a fallback for plain `http://`). Do not use a counter: it restarts after a reload, and a drop with an id that already exists replaces that node. Pass the object as `[config]="config"` and add `<ng-diagram-background type="grid" />` inside `<ng-diagram>` to see the grid. Drops snap only when `shouldSnapDragForNode(node)` returns true (default `() => false`); the step is `computeSnapForNodeDrag(node) ?? defaultDragSnap` (default `{ width: 10, height: 10 }`), applied to the node's top-left corner (since 1.2.0).

## Edge cases

- `paletteItemDropped` gives `{ node, dropPosition }`. `dropPosition` equals `node.position`: the top-left corner in flow coordinates after snapping and middlewares, not the raw pointer point.
- A middleware can change or veto drops; the action type is `'paletteDropNode'`. A cancelled drop adds no node and fires no event (see `ng-diagram-middleware`).
- One palette item creates one node. To drop a prefilled group, add the children in `(paletteItemDropped)` with `addNodes` and `groupId: node.id`.
- The drag image is a copy of the preview put under `<body>` at drag start. CSS that depends on where the preview sits (for example `.sidebar .card`, or CSS variables set on a wrapper element) does not reach it. Style the preview content with its own classes. The library's `--ngd-*` tokens are set on `:root`, so they work.
- The preview element is a block (since 1.4.0): inline content placed next to it inside a palette item starts on a new line.
- `ng-diagram-palette-item` sets an inline `width: 100%` on itself. In a horizontal toolbar, put each item in a wrapper with the width you want.
- `NgDiagramPaletteItemPreviewComponent.preview` is a signal with the `ElementRef` of the element that holds the preview content (`preview()?.nativeElement`). Read its natural size or content; its position means nothing. `scaleTransform` is deprecated since 1.4.0 and no longer used.
- Touch: an item drags with one finger and drops where the finger lifts over the diagram. No drag image follows the finger. A touch that starts on an item does not scroll the palette and does not click buttons inside it (the item calls `preventDefault()` on `touchstart`), so keep buttons out of items and leave room to scroll. See `ng-diagram-touch`.
- The diagram accepts every HTML5 drop. Text that is not JSON (a link, selected text) is ignored with a console warning. Any JSON text is used as a palette item. A drop with no text at all, such as a file from the desktop, still creates a node, with no `data`.

## Symptom → fix

| Symptom | Cause and fix |
| --- | --- |
| `NullInjectorError` for an ng-diagram service when the palette renders | The palette is outside the `provideNgDiagram()` scope. Move it under the providing component (a sibling of `<ng-diagram>` is fine). |
| Template type error on `[item]` with your own data type | Your data type has no `label: string`. Extend `BasePaletteItemData`. |
| Dropped node uses the default template | `item.type` does not match a key in `[nodeTemplateMap]`. |
| Dropped node ignores `item.size` | Add `autoSize: false`. |
| The browser's plain drag image shows, not the preview | The palette item did not find the preview. Put `<ng-diagram-palette-item-preview>` inside `<ng-diagram-palette-item>` in the same template (not inside another component's template), without `@if`. |
| The preview takes space, paints over the palette at high zoom, or adds page scrollbars | Fixed in 1.4.0 — upgrade. |
| Drag image cut off by a panel with `overflow: hidden` | Fixed in 1.2.0 — upgrade. |
| Drag image size differs from the dropped node | Give the preview the node's size and look. Above 3x zoom the image stays at 3x by design. |
| Drops do not snap to the grid | Set `snapping.shouldSnapDragForNode: () => true` and match `defaultDragSnap` with the grid `cellSize`. Before 1.2.0 drops never snapped — upgrade. |
| Node lands below and right of the cursor | By design: the node's top-left corner lands at the pointer, the same way the drag image hangs from the cursor. |
| Dropped node is not selected, or not in the group it was dropped on | By design. Select and group in `(paletteItemDropped)` (recipe above). |
| `[ngDiagram] Invalid drop data: expected type "NgDiagramPaletteItem".` | Something else (a link, selected text) was dropped on the diagram. A custom drag source with non-JSON `text/plain` gets this message too. No node is created. |
| `[ngDiagram] Failed to parse palette drop data as JSON.` | Non-JSON text was dropped after an `ng-diagram-palette-item` had been pressed, for example because your own `dragstart` code replaced the item's `text/plain`. Do not overwrite it; a custom source must use `JSON.stringify(item)`. No node is created. |
| An empty node or a template error after dropping a file | A drop without text creates a node with no `data`. Stop file drops before they reach `<ng-diagram>` (`references/palette-recipes.md`). |
| `data` lost methods, class types or `Date`s after a drop | The item travels as JSON on mouse drags. Store plain data. |
| Ports missing in palette items | By design. |
| The palette cannot be scrolled on a tablet | Touches that start on items belong to the drag. Leave space between or around items for scrolling. |

## Verify before you answer

- Check the installed version in `node_modules/ng-diagram/package.json` (or the lockfile). This skill describes ng-diagram 1.4.0; anything marked "since vX.Y" does not exist in older versions.
- Confirm exact names and signatures in `node_modules/ng-diagram/ng-diagram.d.ts` (its TSDoc has `@since` tags) instead of guessing.
- For more detail, use the ng-diagram docs MCP tools (`search_docs`, `get_doc`, `search_symbols`, `get_symbol`) when available, or https://www.ngdiagram.dev/docs.
