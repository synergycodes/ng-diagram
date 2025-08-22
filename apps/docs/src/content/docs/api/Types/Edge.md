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

> `optional` **routing**: `RoutingName`

The routing of the edge.

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

### staticPath?

> `optional` **staticPath**: `object`

Static path configuration for the edge.
When provided, these points will be used instead of calculated routing.

#### points

> **points**: [`Point`](/api/types/point/)[]

#### svgPath?

> `optional` **svgPath**: `string`

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
