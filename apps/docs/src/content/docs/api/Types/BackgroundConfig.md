---
editUrl: false
next: false
prev: false
title: "BackgroundConfig"
---

Configuration for the diagram background.

## Properties

### dotSize?

> `optional` **dotSize**: `number`

The size of the dots pattern.

#### Default

```ts
60
```

***

### gridSize?

> `optional` **gridSize**: [`Point`](/docs/api/types/point/)

The size of the smallest grid cell (minor grid spacing).
Supports rectangular grids by specifying different x and y values.

#### Default

```ts
{ x: 10, y: 10 }
```

***

### majorLinesFrequency?

> `optional` **majorLinesFrequency**: `object`

How often major grid lines appear (in number of minor grid cells).
For example, { x: 5, y: 5 } means major vertical lines appear every 5 minor cells horizontally,
and major horizontal lines appear every 5 minor cells vertically.

#### x

> **x**: `number`

#### y

> **y**: `number`

#### Default

```ts
{ x: 5, y: 5 }
```
