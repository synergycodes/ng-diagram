---
editUrl: false
next: false
prev: false
title: "GroupNode"
---

Interface representing a group node in the diagram

## Extends

- `SimpleNode`

## Properties

### angle?

> `optional` **angle**: `number`

The angle of the node from 0 to 360.

#### Inherited from

`SimpleNode.angle`

***

### autoSize?

> `optional` **autoSize**: `boolean`

Whether the size of the node is automatically resized based on the content.

#### Inherited from

`SimpleNode.autoSize`

***

### data

> **data**: `Record`\<`string`, `unknown`\>

The data associated with the node.

#### Inherited from

`SimpleNode.data`

***

### groupId?

> `optional` **groupId**: `string`

The id of the parent node.

#### Inherited from

`SimpleNode.groupId`

***

### highlighted

> **highlighted**: `boolean`

Whether the group is highlighted. For example, when a node is being dragged over it.

***

### id

> **id**: `string`

The unique identifier for the node.

#### Inherited from

`SimpleNode.id`

***

### isGroup

> **isGroup**: `true`

Flag indicating the node is a group

***

### ports?

> `optional` **ports**: `Port`[]

The ports of the node.

#### Inherited from

`SimpleNode.ports`

***

### position

> **position**: [`Point`](/api/types/point/)

The position of the node in the diagram.

#### Inherited from

`SimpleNode.position`

***

### resizable?

> `optional` **resizable**: `boolean`

Whether the node is resizable.

#### Inherited from

`SimpleNode.resizable`

***

### rotatable?

> `optional` **rotatable**: `boolean`

Whether the node is rotatable.

#### Inherited from

`SimpleNode.rotatable`

***

### selected?

> `optional` **selected**: `boolean`

Whether the node is selected.

#### Inherited from

`SimpleNode.selected`

***

### size?

> `optional` **size**: `Size`

The size of the node.

#### Inherited from

`SimpleNode.size`

***

### type?

> `optional` **type**: `string`

The type of the node declared in nodeTemplateMap.

#### Inherited from

`SimpleNode.type`

***

### zIndex?

> `optional` **zIndex**: `number`

The z-index of the node. This value is set automatically

#### Inherited from

`SimpleNode.zIndex`

***

### zOrder?

> `optional` **zOrder**: `number`

The z-order of the node.

#### Inherited from

`SimpleNode.zOrder`
