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

> **hidden**: `InputSignalWithTransform`\<`boolean`, `unknown`\>

Whether the label is hidden. Defaults to `false`.

A hidden label stays in the DOM with `display: none` and never blocks
initialization or `waitForMeasurements`. When the label becomes visible
again, it is measured again automatically.

A plain `hidden` attribute without a binding also works and means hidden,
like the native HTML attribute.

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
