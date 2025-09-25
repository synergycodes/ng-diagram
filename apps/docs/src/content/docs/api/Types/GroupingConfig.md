---
editUrl: false
next: false
prev: false
title: "GroupingConfig"
---

Configuration for node grouping behavior.

## Properties

### canGroup()

> **canGroup**: (`node`, `group`) => `boolean`

Determines if a node can be grouped into a group node.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to group.

##### group

[`Node`](/docs/api/types/node/)

The group node.

#### Returns

`boolean`

True if the node can be grouped, false otherwise.

***

### enforceGroupMinSizeToChildren?

> `optional` **enforceGroupMinSizeToChildren**: `boolean`

Prevents resizing a group smaller than its children, ensuring all children remain contained within the group.
Default: false (group can be resized below children size).
