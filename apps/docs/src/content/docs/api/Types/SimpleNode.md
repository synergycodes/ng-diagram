---
editUrl: false
next: false
prev: false
title: "SimpleNode"
---

Interface representing the most basic node in the diagram

## Extended by

- [`GroupNode`](/docs/api/types/groupnode/)

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
The z-index of the node. This value is set automatically

***

### data

> **data**: `T`

The data associated with the node.

***

### groupId?

> `optional` **groupId**: `string`

The id of the parent node.

***

### id

> **id**: `string`

The unique identifier for the node.

***

### measuredPorts?

> `readonly` `optional` **measuredPorts**: [`Port`](/docs/api/types/port/)[]

#### Remarks

MeasuredPorts are computed by the system and should not be set manually.
The ports of the node with computed position and size.

***

### position

> **position**: [`Point`](/docs/api/types/point/)

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

> `optional` **size**: [`Size`](/docs/api/types/size/)

The size of the node.

***

### type?

> `optional` **type**: `string`

The type of the node declared in nodeTemplateMap.

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the node.
