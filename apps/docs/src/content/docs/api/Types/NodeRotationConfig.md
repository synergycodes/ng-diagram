---
editUrl: false
next: false
prev: false
title: "NodeRotationConfig"
---

Configuration for node rotation behavior.

## Properties

### computeSnapAngleForNode()

> **computeSnapAngleForNode**: (`node`) => `null` \| `number`

Computes the snap angle for a node's rotation.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to compute the snap angle for.

#### Returns

`null` \| `number`

The angle in degrees to snap to, or null if default snapping should be used.

***

### defaultSnapAngle

> **defaultSnapAngle**: `number`

The default snap angle in degrees. Used if computeSnapAngleForNode returns null.

#### Default

```ts
15
```

***

### shouldSnapForNode()

> **shouldSnapForNode**: (`node`) => `boolean`

Determines if rotation snapping should be enabled for a node.

#### Parameters

##### node

[`Node`](/docs/api/types/node/)

The node to check for rotation snapping.

#### Returns

`boolean`

True if rotation should snap, false otherwise.
