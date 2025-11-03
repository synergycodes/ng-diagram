---
editUrl: false
next: false
prev: false
title: "BackgroundConfig"
---

Configuration for the diagram background.

## Properties

### cellSize?

> `optional` **cellSize**: [`Size`](/docs/api/types/size/)

The size of the smallest grid cell (minor grid spacing).
Supports rectangular grids by specifying different width and height values.

#### Default

```ts
{ width: 10, height: 10 }
```

***

### dotSpacing?

> `optional` **dotSpacing**: `number`

Distance in pixels between consecutive dots in the background pattern.

#### Default

```ts
60
```

***

### majorLinesFrequency?

> `optional` **majorLinesFrequency**: `object`

Specifies how often major grid lines occur, measured in counts of minor grid cells.
E.g., { x: 5, y: 5 } draws a major vertical line every 5 minor columns and
a major horizontal line every 5 minor rows.

#### x

> **x**: `number`

#### y

> **y**: `number`

#### Default

```ts
{ x: 5, y: 5 }
```
