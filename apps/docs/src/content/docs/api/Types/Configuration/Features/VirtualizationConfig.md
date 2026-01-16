---
version: "since v0.9.1"
editUrl: false
next: false
prev: false
title: "VirtualizationConfig"
---

Configuration for viewport virtualization behavior.
When enabled, only nodes and edges visible in the viewport (plus padding) are rendered,
significantly improving performance for large diagrams.

## Properties

### enabled

> **enabled**: `boolean`

Whether viewport virtualization is enabled.
When disabled, all nodes/edges are rendered regardless of viewport.

#### Default

```ts
false
```

***

### idleDelay?

> `optional` **idleDelay**: `number`

Delay in milliseconds after panning stops before re-rendering visible nodes.

#### Default

```ts
100
```

***

### padding

> **padding**: `number`

Padding multiplier relative to viewport size.
The actual padding is calculated as: max(viewportWidth, viewportHeight) * padding
For example, 0.5 means 50% of the viewport size as padding in each direction.

#### Default

```ts
0.5
```
