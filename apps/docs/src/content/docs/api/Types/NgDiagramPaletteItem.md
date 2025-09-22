---
editUrl: false
next: false
prev: false
title: "NgDiagramPaletteItem"
---

> **NgDiagramPaletteItem**\<`Data`\> = `SimpleNodeData`\<`Data`\> \| `GroupNodeData`\<`Data`\>

The `NgDiagramPaletteItem` represents the data structure for items that can be shown in the diagram palette
and dragged onto the canvas to create nodes or groups.
It supports both simple nodes and group nodes, allowing you to specify
properties such as type, data, size, rotation, and grouping.

Example usage:
```typescript
const paletteItem: NgDiagramPaletteItem = {
  type: 'customNode',
  data: { label: 'My Node' },
  resizable: true,
  rotatable: false,
};
```

## Type Parameters

### Data

`Data` *extends* `object` = `BasePaletteItemData`
