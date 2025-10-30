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

#### Default

```ts
true
```
