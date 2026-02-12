---
version: "since v1.0.0"
editUrl: false
next: false
prev: false
title: "MinimapNodeStyle"
---

Style properties that can be applied to minimap nodes.
All properties are optional - unset properties use CSS defaults.

## Properties

### cssClass?

> `optional` **cssClass**: `string`

CSS class to apply to the node

***

### fill?

> `optional` **fill**: `string`

Fill color for the node

***

### opacity?

> `optional` **opacity**: `number`

Opacity from 0 to 1

***

### shape?

> `optional` **shape**: [`MinimapNodeShape`](/docs/api/types/minimap/minimapnodeshape/)

Shape of the node in the minimap. Defaults to 'rect'.

***

### stroke?

> `optional` **stroke**: `string`

Stroke color for the node

***

### strokeWidth?

> `optional` **strokeWidth**: `number`

Stroke width in pixels
