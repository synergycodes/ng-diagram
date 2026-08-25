---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "Edge"
---

Interface representing an edge (connection) between nodes in the flow diagram

## Type Parameters

### T

`T` *extends* `DataObject` = `DataObject`

## Properties

### computedHidden?

> `readonly` `optional` **computedHidden**: `boolean`

#### Remarks

ComputedHidden is computed by the system and should not be set manually.
The effective visibility applied to the edge: true when its own `hidden`
flag (or a template-level hidden binding) is set, or when either endpoint
node is effectively hidden.

#### Since

1.4.0

***

### computedZIndex?

> `readonly` `optional` **computedZIndex**: `number`

#### Remarks

ComputedZIndex is computed by the system and should not be set manually.
The final z-index applied to the DOM element for rendering order.
Without `zOrder`: derived from `max(source, target)` connected node z-indices.
With `zOrder`: uses the explicit value plus connected node elevation.

***

### data

> **data**: `T`

The data associated with the edge.

***

### hidden?

> `optional` **hidden**: `boolean`

Whether the edge is hidden. Absent means visible.

Hidden edges stay mounted in the DOM as `display: none`, keep their
geometry, do not block initialization or measurement waits, are not
routed, and are excluded from selection and zoomToFit bounds. An edge is
also effectively hidden when either endpoint node is effectively hidden.

Set by the user; the library only reads it.

#### See

[computedHidden](/docs/api/types/model/edge/#computedhidden) for the derived effective visibility.

#### Since

1.4.0

***

### id

> **id**: `string`

The unique identifier for the edge.

***

### measuredLabels?

> `readonly` `optional` **measuredLabels**: [`EdgeLabel`](/docs/api/types/model/edgelabel/)[]

#### Remarks

MeasuredLabels are computed by the system and should not be set manually.
The labels of the edge with computed position and size.

***

### points?

> `optional` **points**: [`Point`](/docs/api/types/geometry/point/)[]

The points of the edge defining the path.

***

### routing?

> `optional` **routing**: [`EdgeRoutingName`](/docs/api/types/routing/edgeroutingname/)

The routing of the edge.

***

### routingMode?

> `optional` **routingMode**: [`RoutingMode`](/docs/api/types/routing/routingmode/)

The routing mode of the edge.
'auto' (default): Points are computed automatically based on routing algorithm
'manual': Points are provided by the user and routing algorithm is used to render the path

***

### selected?

> `optional` **selected**: `boolean`

Whether the edge is selected

***

### source

> **source**: `string`

The source node of the edge. If empty string it will use sourcePosition.

***

### sourceArrowhead?

> `optional` **sourceArrowhead**: `string`

The id of the source arrowhead of the edge.

***

### sourcePort?

> `optional` **sourcePort**: `string`

The port of the source node.

***

### sourcePosition?

> `optional` **sourcePosition**: [`Point`](/docs/api/types/geometry/point/)

The position of the edge start.

***

### target

> **target**: `string`

The target node of the edge. If empty string it will use targetPosition.

***

### targetArrowhead?

> `optional` **targetArrowhead**: `string`

The id of the target arrowhead of the edge.

***

### targetPort?

> `optional` **targetPort**: `string`

The port of the target node.

***

### targetPosition?

> `optional` **targetPosition**: [`Point`](/docs/api/types/geometry/point/)

The position of the edge end.

***

### temporary?

> `optional` **temporary**: `boolean`

Whether the edge is temporary.

***

### type?

> `optional` **type**: `string`

The type of the edge declared in edgeTemplateMap.

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the edge. When set, overrides the default edge z-index
(which is derived from connected nodes). When a connected node is selected,
the node's elevation is added so the edge stays visible above elevated nodes.

Set by `bringToFront` / `sendToBack` commands, or manually.

#### See

[computedZIndex](/docs/api/types/model/edge/#computedzindex) for the final rendered z-index.
