---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ZIndexConfig"
---

Configuration for z-index layering behavior.

## Properties

### edgesAboveConnectedNodes

> **edgesAboveConnectedNodes**: `boolean`

Whether edges should appear above their connected nodes.

#### Default

```ts
false
```

***

### elevateOnSelection

> **elevateOnSelection**: `boolean`

Whether selected elements should be elevated to selectedZIndex.

#### Default

```ts
true
```

***

### enabled

> **enabled**: `boolean`

Whether z-index middleware is enabled.

#### Default

```ts
true
```

***

### selectedZIndex

> **selectedZIndex**: `number`

The z-index value for selected elements.

#### Default

```ts
1000
```

***

### temporaryEdgeZIndex

> **temporaryEdgeZIndex**: `number`

The z-index value for temporary edge.

#### Default

```ts
1000
```
