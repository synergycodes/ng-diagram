---
editUrl: false
next: false
prev: false
title: "SnappingConfig"
---

Configuration for node dragging behavior.

## Properties

### computeSnapForNodeDrag()

> **computeSnapForNodeDrag**: (`node`) => `null` \| [`Size`](/docs/api/types/size/)

Computes the snap size for a node while dragging. If null is returned, a default snap size will be used.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the snap size for dragging.

#### Returns

`null` \| [`Size`](/docs/api/types/size/)

The snap size for the node while dragging, or null.

***

### computeSnapForNodeSize()

> **computeSnapForNodeSize**: (`node`) => `null` \| [`Size`](/docs/api/types/size/)

Computes the snap size for a node while resizing. If null is returned, a default snap size will be used.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the snap size for resizing.

#### Returns

`null` \| [`Size`](/docs/api/types/size/)

The snap size for the node while resizing, or null.

#### Default

```ts
() => null
```

***

### defaultDragSnap

> **defaultDragSnap**: [`Size`](/docs/api/types/size/)

The default snap size for node dragging.

#### Default

```ts
{ width: 10, height: 10 }
```

***

### defaultResizeSnap

> **defaultResizeSnap**: [`Size`](/docs/api/types/size/)

The default snap size for node resizing.

#### Default

```ts
{ width: 10, height: 10 }
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

#### Default

```ts
() => false
```

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

#### Default

```ts
() => false
```
