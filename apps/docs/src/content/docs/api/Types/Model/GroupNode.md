---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "GroupNode"
---

Interface representing a group node in the diagram

## Extends

- [`SimpleNode`](/docs/api/types/model/simplenode/)\<`T`\>

## Type Parameters

### T

`T` *extends* `DataObject` = `DataObject`

## Properties

### angle?

> `optional` **angle**: `number`

The angle of the node from 0 to 360.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`angle`](/docs/api/types/model/simplenode/#angle)

***

### autoSize?

> `optional` **autoSize**: `boolean`

Whether the size of the node is automatically resized based on the content.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`autoSize`](/docs/api/types/model/simplenode/#autosize)

***

### computedZIndex?

> `readonly` `optional` **computedZIndex**: `number`

#### Remarks

ComputedZIndex is computed by the system and should not be set manually.
The z-index of the node. This value is set automatically

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`computedZIndex`](/docs/api/types/model/simplenode/#computedzindex)

***

### data

> **data**: `T`

The data associated with the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`data`](/docs/api/types/model/simplenode/#data)

***

### draggable?

> `optional` **draggable**: `boolean`

Whether the node is draggable.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`draggable`](/docs/api/types/model/simplenode/#draggable)

***

### groupId?

> `optional` **groupId**: `string`

The id of the parent node.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`groupId`](/docs/api/types/model/simplenode/#groupid)

***

### highlighted

> **highlighted**: `boolean`

Whether the group is highlighted. For example, when a node is being dragged over it.

***

### id

> **id**: `string`

The unique identifier for the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`id`](/docs/api/types/model/simplenode/#id)

***

### isGroup

> **isGroup**: `true`

Flag indicating the node is a group

***

### measuredBounds?

> `readonly` `optional` **measuredBounds**: [`Rect`](/docs/api/types/geometry/rect/)

#### Remarks

MeasuredBounds are computed by the system and should not be set manually.
Bounding box that encompasses the node including its ports, accounting for rotation.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`measuredBounds`](/docs/api/types/model/simplenode/#measuredbounds)

***

### measuredPorts?

> `readonly` `optional` **measuredPorts**: [`Port`](/docs/api/types/model/port/)[]

#### Remarks

MeasuredPorts are computed by the system and should not be set manually.
The ports of the node with computed position and size.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`measuredPorts`](/docs/api/types/model/simplenode/#measuredports)

***

### position

> **position**: [`Point`](/docs/api/types/geometry/point/)

The position of the node in the diagram.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`position`](/docs/api/types/model/simplenode/#position)

***

### resizable?

> `optional` **resizable**: `boolean`

Whether the node is resizable.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`resizable`](/docs/api/types/model/simplenode/#resizable)

***

### rotatable?

> `optional` **rotatable**: `boolean`

Whether the node is rotatable.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`rotatable`](/docs/api/types/model/simplenode/#rotatable)

***

### selected?

> `optional` **selected**: `boolean`

Whether the node is selected.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`selected`](/docs/api/types/model/simplenode/#selected)

***

### size?

> `optional` **size**: [`Size`](/docs/api/types/geometry/size/)

The size of the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`size`](/docs/api/types/model/simplenode/#size)

***

### type?

> `optional` **type**: `string`

The type of the node declared in nodeTemplateMap.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`type`](/docs/api/types/model/simplenode/#type)

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/model/simplenode/).[`zOrder`](/docs/api/types/model/simplenode/#zorder)
