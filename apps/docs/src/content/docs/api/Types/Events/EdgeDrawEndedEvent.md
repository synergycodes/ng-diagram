---
version: "since v1.2.0"
editUrl: false
next: false
prev: false
title: "EdgeDrawEndedEvent"
---

Event payload emitted when an edge draw gesture ends, regardless of outcome.

Fires on every linking completion — both successful and cancelled.
For successful completions, `edge`, `target`, and `targetPort` are populated.
For cancellations, `reason` indicates why the gesture was cancelled.

## Properties

### dropPosition

> **dropPosition**: [`Point`](/docs/api/types/geometry/point/)

The position where the pointer was released

***

### edge?

> `optional` **edge**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>

The created edge (only present on success)

***

### reason?

> `optional` **reason**: [`EdgeDrawCancelReason`](/docs/api/types/events/edgedrawcancelreason/)

The reason the draw was cancelled (only present on cancel)

***

### source

> **source**: [`Node`](/docs/api/types/model/node/)

The source node from which the edge was drawn

***

### sourcePort?

> `optional` **sourcePort**: `string`

Source port identifier if connected to a specific port

***

### success

> **success**: `boolean`

Whether the edge was successfully created

***

### target?

> `optional` **target**: [`Node`](/docs/api/types/model/node/)

The target node (only present on success)

***

### targetPort?

> `optional` **targetPort**: `string`

Target port identifier (only present on success)
