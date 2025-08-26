---
editUrl: false
next: false
prev: false
title: "Edge"
---

Interface representing an edge (connection) between nodes in the flow diagram

## Type Parameters

### T

`T` = `any`

## Properties

### data

> **data**: `T`

The data associated with the edge.

***

### id

> **id**: `string`

The unique identifier for the edge.

***

### labels?

> `optional` **labels**: `EdgeLabel`[]

The labels of the edge.

***

### points?

> `optional` **points**: [`Point`](/api/types/point/)[]

The points of the edge defining the path.

***

### routing?

> `optional` **routing**: `EdgeRoutingName`

The routing of the edge.

***

### routingMode?

> `optional` **routingMode**: `RoutingMode`

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

> `optional` **sourcePosition**: [`Point`](/api/types/point/)

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

> `optional` **targetPosition**: [`Point`](/api/types/point/)

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

### zIndex?

> `optional` **zIndex**: `number`

The z-index of the node. This value is set automatically

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the edge.
