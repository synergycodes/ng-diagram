---
editUrl: false
next: false
prev: false
title: "SelectionMovingConfig"
---

Configuration for selection moving behavior.

## Properties

### edgePanningEnabled

> **edgePanningEnabled**: `boolean`

Enable edge panning when the moved node is near the edge of the viewport.

#### Default

```ts
true
```

***

### edgePanningForce

> **edgePanningForce**: `number`

Multiplier for edge panning speed while dragging nodes near the edge of the viewport.

#### Default

```ts
1
```

#### Default

```ts
15
```

***

### edgePanningThreshold

> **edgePanningThreshold**: `number`

The threshold in pixels for edge panning to start.
If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.

#### Default

```ts
30
```
