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
By default a group can be resized below children size.

#### Default

```ts
true
```

***

### defaultResizable

> **defaultResizable**: `boolean`

The default resizable state for nodes.

#### Default

```ts
true
```

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

#### Default

```ts
() => ({ width: 20, height: 20 })
```
