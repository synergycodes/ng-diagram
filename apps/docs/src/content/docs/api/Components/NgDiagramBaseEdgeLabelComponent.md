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

### hidden

> **hidden**: `InputSignal`\<`boolean`\>

Whether the label is hidden. Defaults to false.

A hidden label stays mounted as `display: none` and creates no
measurement expectation (it never blocks initialization or
`waitForMeasurements`). Unhiding re-measures it through the existing
ResizeObserver path.

#### Since

1.4.0

***

### id

> **id**: `InputSignal`\<`string`\>

The unique identifier for the edge label.

***

### positionOnEdge

> **positionOnEdge**: `InputSignal`\<[`EdgeLabelPosition`](/docs/api/types/model/edgelabelposition/)\>

The relative position of the label along the edge (from 0 to 1).
