---
version: "since v1.2.3"
editUrl: false
next: false
prev: false
title: "InvalidateMeasurementsOptions"
---

Options for selective invalidation of diagram element measurements.
When provided to `invalidateMeasurements()`, only the specified elements
are re-measured. When omitted, all elements are re-measured.

## Properties

### edgeLabels?

> `optional` **edgeLabels**: `object`[]

Edges whose labels should be re-measured.

#### edgeId

> **edgeId**: `string`

***

### nodes?

> `optional` **nodes**: `object`[]

Nodes to re-measure. Invalidating a node also re-measures all its ports.

#### nodeId

> **nodeId**: `string`
