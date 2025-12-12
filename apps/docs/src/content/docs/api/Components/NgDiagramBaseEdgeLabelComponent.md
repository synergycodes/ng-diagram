---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeLabelComponent"
---

The `NgDiagramBaseEdgeLabelComponent` is responsible for displaying a label at a specific position along an edge.

## Example usage
```html
<ng-diagram-base-edge-label
  [id]="labelId"
  [positionOnEdge]="0.5"
>
  <!-- Any label content here (text, icon, button) -->
</ng-diagram-base-edge-label>
```

## Implements

- `OnInit`
- `OnDestroy`

## Properties

### id

> **id**: `InputSignal`\<`string`\>

The unique identifier for the edge label.

***

### positionOnEdge

> **positionOnEdge**: `InputSignal`\<`number`\>

The relative position of the label along the edge (from 0 to 1).
