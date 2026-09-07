---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramPaletteItemPreviewComponent"
---

The `NgDiagramPaletteItemPreviewComponent` defines the preview of a palette item shown while it is
dragged onto the canvas.

## Example usage
```html
<ng-diagram-palette-item-preview>
  <!-- Palette item content here -->
</ng-diagram-palette-item-preview>
```

## Properties

### preview

> `readonly` **preview**: `Signal`\<`undefined` \| `ElementRef`\<`HTMLElement`\>\>

The element holding the preview content. It is not rendered in the page flow, so read the
preview's natural size or content from it — its position is meaningless.

## Accessors

### scaleTransform

#### Get Signature

> **get** **scaleTransform**(): `string`

:::caution[Deprecated]
The drag image is scaled internally, so this value is no longer used. It will be
removed in the next major version.
:::

##### Returns

`string`
