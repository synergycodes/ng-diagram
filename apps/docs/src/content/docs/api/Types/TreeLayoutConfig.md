---
editUrl: false
next: false
prev: false
title: "TreeLayoutConfig"
---

Configuration for tree layout behavior.

## Properties

### autoLayout

> **autoLayout**: `boolean`

Whether to automatically apply tree layout on structural changes.

***

### getLayoutAlignmentForNode()

> **getLayoutAlignmentForNode**: (`node`) => `null` \| `LayoutAlignmentType`

Gets the layout alignment for a node in a tree structure.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to get the alignment for.

#### Returns

`null` \| `LayoutAlignmentType`

The alignment type for the node, or null for default alignment.

***

### getLayoutAngleForNode()

> **getLayoutAngleForNode**: (`node`) => `null` \| `LayoutAngleType`

Gets the layout angle for positioning a node in a tree structure.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to get the layout angle for.

#### Returns

`null` \| `LayoutAngleType`

The angle in degrees for the node's position in the tree, or null for default positioning.

***

### layoutAlignment

> **layoutAlignment**: `LayoutAlignmentType`

Default layout alignment ('parent', 'subtree', 'start').

***

### layoutAngle

> **layoutAngle**: `LayoutAngleType`

Default layout angle for nodes (0, 90, 180, 270).

***

### levelGap

> **levelGap**: `number`

Gap between parent and child nodes.

***

### siblingGap

> **siblingGap**: `number`

Gap between sibling nodes in the same row/column.

***

### treeGap

> **treeGap**: `number`

Gap between separate tree roots when multiple trees exist.
