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

Edge labels to re-measure.

#### edgeId

> **edgeId**: `string`

#### labelId

> **labelId**: `string`

***

### nodes?

> `optional` **nodes**: `object`[]

Nodes to re-measure. Invalidating a node also re-measures all its ports.

#### nodeId

> **nodeId**: `string`
