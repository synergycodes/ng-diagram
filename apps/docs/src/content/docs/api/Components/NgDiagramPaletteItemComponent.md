---
editUrl: false
next: false
prev: false
title: "NgDiagramPaletteItemComponent"
---

The `NgDiagramPaletteItemComponent` represents a single item in the diagram palette.

## Example usage
```html
<ng-diagram-palette-item [item]="item">
  <!-- Palette item content here -->
  <ng-diagram-palette-item-preview>
    <!-- Optional: custom preview content -->
  </ng-diagram-palette-item-preview>
</ng-diagram-palette-item>
```

## Properties

### item

> **item**: `InputSignal`\<[`NgDiagramPaletteItem`](/docs/api/types/ngdiagrampaletteitem/)\>

The palette item data to be rendered and managed.
