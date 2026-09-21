---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

Base edge component that handles edge rendering.
It can be extended or used directly to render edges in the diagram.

## Properties

### dangling

> `readonly` **dangling**: `Signal`\<`boolean`\>

Whether the edge has at least one free (unconnected) endpoint. Temporary
edges are excluded: a draw preview always has a free end, but it must not
get the dangling styling.

***

### edge

> **edge**: `InputSignal`\<[`Edge`](/docs/api/types/model/edge/)\<`object`\>\>

Edge data model

***

### relinkHandleHitRadius

> `readonly` **relinkHandleHitRadius**: `Signal`\<`number`\>

Radius of the invisible hit circle around each handle, in flow units. The
radius is divided by the viewport scale, so the hit area keeps a constant,
finger-friendly size on screen at any zoom level. Without this, at zoom
0.5 the visible 5px circle would give only a 2.5px touch target.

#### Since

1.4.0

***

### relinkSourceHandle

> `readonly` **relinkSourceHandle**: `Signal`\<[`Point`](/docs/api/types/geometry/point/)\>

Position of the source endpoint handle (the first routed point).

#### Since

1.4.0

***

### relinkSourceHandleVisible

> `readonly` **relinkSourceHandleVisible**: `Signal`\<`boolean`\>

Whether the source endpoint handle is rendered. It is rendered when the
edge is selected, is not a temporary edge, has routed points, and its
source end can be relinked.

#### Since

1.4.0

***

### relinkTargetHandle

> `readonly` **relinkTargetHandle**: `Signal`\<[`Point`](/docs/api/types/geometry/point/)\>

Position of the target endpoint handle (the last routed point).

#### Since

1.4.0

***

### relinkTargetHandleVisible

> `readonly` **relinkTargetHandleVisible**: `Signal`\<`boolean`\>

Same as [relinkSourceHandleVisible](/docs/api/components/ngdiagrambaseedgecomponent/#relinksourcehandlevisible) for the target end.

#### Since

1.4.0

***

### routing

> **routing**: `InputSignal`\<`undefined` \| `string`\>

Edge routing mode

***

### sourceArrowhead

> **sourceArrowhead**: `InputSignal`\<`undefined` \| `string`\>

ID of a source <marker> element in the SVG document. Edge model data has precedence over this property.

***

### stroke

> **stroke**: `InputSignal`\<`undefined` \| `string`\>

Stroke color of the edge. Edge model data has precedence over this property.

***

### strokeDasharray

> **strokeDasharray**: `InputSignal`\<`undefined` \| `string`\>

Stroke dash array of the edge (e.g., '5 5' for dashed line, '10 5 2 5' for dash-dot pattern).

***

### strokeOpacity

> **strokeOpacity**: `InputSignal`\<`undefined` \| `number`\>

Stroke opacity of the edge

***

### strokeWidth

> **strokeWidth**: `InputSignal`\<`undefined` \| `number`\>

Stroke width of the edge

***

### targetArrowhead

> **targetArrowhead**: `InputSignal`\<`undefined` \| `string`\>

ID of a target <marker> element in the SVG document. Edge model data has precedence over this property.

***

### useInlineMarkers

> `readonly` **useInlineMarkers**: `boolean`

Whether to use inline markers (Safari fallback).
Safari doesn't support context-stroke, so we render markers inline per edge.
