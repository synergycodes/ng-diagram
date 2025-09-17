---
editUrl: false
next: false
prev: false
title: "GroupNode"
---

Interface representing a group node in the diagram

## Extends

- [`SimpleNode`](/docs/api/types/simplenode/)\<`T`\>

## Type Parameters

### T

`T` *extends* `DataObject` = `DataObject`

## Properties

### angle?

> `optional` **angle**: `number`

The angle of the node from 0 to 360.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`angle`](/docs/api/types/simplenode/#angle)

***

### autoSize?

> `optional` **autoSize**: `boolean`

Whether the size of the node is automatically resized based on the content.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`autoSize`](/docs/api/types/simplenode/#autosize)

***

### computedZIndex?

> `readonly` `optional` **computedZIndex**: `number`

#### Remarks

ComputedZIndex is computed by the system and should not be set manually.
The z-index of the node. This value is set automatically

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`computedZIndex`](/docs/api/types/simplenode/#computedzindex)

***

### data

> **data**: `T`

The data associated with the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`data`](/docs/api/types/simplenode/#data)

***

### groupId?

> `optional` **groupId**: `string`

The id of the parent node.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`groupId`](/docs/api/types/simplenode/#groupid)

***

### highlighted

> **highlighted**: `boolean`

Whether the group is highlighted. For example, when a node is being dragged over it.

***

### id

> **id**: `string`

The unique identifier for the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`id`](/docs/api/types/simplenode/#id)

***

### isGroup

> **isGroup**: `true`

Flag indicating the node is a group

***

### measuredPorts?

> `readonly` `optional` **measuredPorts**: [`Port`](/docs/api/types/port/)[]

#### Remarks

MeasuredPorts are computed by the system and should not be set manually.
The ports of the node with computed position and size.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`measuredPorts`](/docs/api/types/simplenode/#measuredports)

***

### position

> **position**: [`Point`](/docs/api/types/point/)

The position of the node in the diagram.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`position`](/docs/api/types/simplenode/#position)

***

### resizable?

> `optional` **resizable**: `boolean`

Whether the node is resizable.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`resizable`](/docs/api/types/simplenode/#resizable)

***

### rotatable?

> `optional` **rotatable**: `boolean`

Whether the node is rotatable.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`rotatable`](/docs/api/types/simplenode/#rotatable)

***

### selected?

> `optional` **selected**: `boolean`

Whether the node is selected.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`selected`](/docs/api/types/simplenode/#selected)

***

### size?

> `optional` **size**: [`Size`](/docs/api/types/size/)

The size of the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`size`](/docs/api/types/simplenode/#size)

***

### type?

> `optional` **type**: `string`

The type of the node declared in nodeTemplateMap.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`type`](/docs/api/types/simplenode/#type)

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the node.

#### Inherited from

[`SimpleNode`](/docs/api/types/simplenode/).[`zOrder`](/docs/api/types/simplenode/#zorder)
