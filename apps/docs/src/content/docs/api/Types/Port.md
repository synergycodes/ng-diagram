---
editUrl: false
next: false
prev: false
title: "Port"
---

Interface representing a port in the node.

## Properties

### id

> **id**: `string`

The unique identifier for the port.

***

### nodeId

> **nodeId**: `string`

The id of the node that the port belongs to.

***

### position?

> `optional` **position**: [`Point`](/docs/api/types/point/)

The position of the port in the node.

***

### side

> **side**: [`PortSide`](/docs/api/types/portside/)

The side of the node that the port is on.

***

### size?

> `optional` **size**: [`Size`](/docs/api/types/size/)

The size of the port.

***

### type

> **type**: `"source"` \| `"target"` \| `"both"`

The type of the port.
