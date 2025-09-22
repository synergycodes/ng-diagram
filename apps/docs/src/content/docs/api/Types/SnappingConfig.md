---
editUrl: false
next: false
prev: false
title: "SnappingConfig"
---

Configuration for node dragging behavior.

## Properties

### computeSnapForNodeDrag()

> **computeSnapForNodeDrag**: (`node`) => `null` \| [`Point`](/docs/api/types/point/)

Computes the snap point for a node while dragging. If null is returned, a default snap point will be used.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the snap point for dragging.

#### Returns

`null` \| [`Point`](/docs/api/types/point/)

The snap point for the node while dragging, or null.

***

### computeSnapForNodeSize()

> **computeSnapForNodeSize**: (`node`) => `null` \| [`Point`](/docs/api/types/point/)

Computes the snap point for a node while resizing. If null is returned, a default snap point will be used.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the snap point for resizing.

#### Returns

`null` \| [`Point`](/docs/api/types/point/)

The snap point for the node while resizing, or null.

***

### defaultDragSnap

> **defaultDragSnap**: [`Point`](/docs/api/types/point/)

The default snap point for node dragging.

#### Default

```ts
{ x: 10, y: 10 }
```

***

### defaultResizeSnap

> **defaultResizeSnap**: [`Point`](/docs/api/types/point/)

The default snap point for node resizing.

#### Default

```ts
{ x: 10, y: 10 }
```

***

### shouldSnapDragForNode()

> **shouldSnapDragForNode**: (`node`) => `boolean`

Determines if a node should snap to grid while dragging.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node being dragged.

#### Returns

`boolean`

True if the node should snap to grid, false otherwise.

***

### shouldSnapResizeForNode()

> **shouldSnapResizeForNode**: (`node`) => `boolean`

Determines if a node should snap to grid while resizing.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node being resized.

#### Returns

`boolean`

True if the node should snap to grid, false otherwise.
