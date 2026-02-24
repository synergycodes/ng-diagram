---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "EdgeLabel"
---

Interface representing a label of an edge.

## Properties

### id

> **id**: `string`

The id of the label.

***

### position?

> `optional` **position**: [`Point`](/docs/api/types/geometry/point/)

The position of the label on flow.

***

### positionOnEdge

> **positionOnEdge**: [`EdgeLabelPosition`](/docs/api/types/model/edgelabelposition/)

The position of the label on the edge.

- **Relative** (`number`, 0-1): 0 is the source, 1 is the target, 0.5 is the midpoint.
- **Absolute** (`'Npx'`): pixel distance from source (positive) or target (negative).

#### Example

```ts
positionOnEdge: 0.5      // midpoint (relative)
positionOnEdge: '30px'   // 30px from source (absolute)
positionOnEdge: '-20px'  // 20px from target (absolute)
```

***

### size?

> `optional` **size**: [`Size`](/docs/api/types/geometry/size/)

The size of the label.
