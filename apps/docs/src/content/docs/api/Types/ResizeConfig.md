---
editUrl: false
next: false
prev: false
title: "ResizeConfig"
---

Configuration for node resizing behavior.

## Properties

### allowResizeBelowChildrenBounds

> **allowResizeBelowChildrenBounds**: `boolean`

Allows resizing a group node smaller than its children bounds.
When set to false, a group node cannot be resized smaller than the bounding box of its children.
Default: true (group can be resized below children size).

***

### getMinNodeSize()

> **getMinNodeSize**: (`node`) => [`Size`](/docs/api/types/size/)

Returns the minimum allowed size for a node.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the minimum size for.

#### Returns

[`Size`](/docs/api/types/size/)
