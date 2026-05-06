---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "SimpleNode"
---

Interface representing the most basic node in the diagram

## Extended by

- [`GroupNode`](/docs/api/types/model/groupnode/)

## Type Parameters

### T

`T` *extends* `DataObject` = `DataObject`

## Properties

### angle?

> `optional` **angle**: `number`

The angle of the node from 0 to 360.

***

### autoSize?

> `optional` **autoSize**: `boolean`

Whether the size of the node is automatically resized based on the content.

***

### computedZIndex?

> `readonly` `optional` **computedZIndex**: `number`

#### Remarks

ComputedZIndex is computed by the system and should not be set manually.
The final z-index applied to the DOM element for rendering order.
Computed from `zOrder`, group hierarchy, and selection elevation.
Children are always above their parent group.

***

### data

> **data**: `T`

The data associated with the node.

***

### draggable?

> `optional` **draggable**: `boolean`

Whether the node is draggable.

***

### groupId?

> `optional` **groupId**: `string`

The id of the parent node.

***

### id

> **id**: `string`

The unique identifier for the node.

***

### measuredBounds?

> `readonly` `optional` **measuredBounds**: [`Rect`](/docs/api/types/geometry/rect/)

#### Remarks

MeasuredBounds are computed by the system and should not be set manually.
Bounding box that encompasses the node including its ports, accounting for rotation.

***

### measuredPorts?

> `readonly` `optional` **measuredPorts**: [`Port`](/docs/api/types/model/port/)[]

#### Remarks

MeasuredPorts are computed by the system and should not be set manually.
The ports of the node with computed position and size.

***

### position

> **position**: [`Point`](/docs/api/types/geometry/point/)

The position of the node in the diagram.

***

### resizable?

> `optional` **resizable**: `boolean`

Whether the node is resizable.

***

### rotatable?

> `optional` **rotatable**: `boolean`

Whether the node is rotatable.

***

### selected?

> `optional` **selected**: `boolean`

Whether the node is selected.

***

### size?

> `optional` **size**: [`Size`](/docs/api/types/geometry/size/)

The size of the node.

***

### type?

> `optional` **type**: `string`

The type of the node declared in nodeTemplateMap.

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the node. Controls relative ordering among nodes on the same hierarchy level.
With proper values, it can also influence ordering across different hierarchy levels,
since each nesting level adds +1 to the computed z-index per child.
- Root nodes: used directly as the base z-index (negative values allowed).
- Grouped nodes: acts as a minimum floor — cannot go below the parent's z-index.

Set by `bringToFront` / `sendToBack` commands, or manually.

#### See

[computedZIndex](/docs/api/types/model/simplenode/#computedzindex) for the final rendered z-index.
