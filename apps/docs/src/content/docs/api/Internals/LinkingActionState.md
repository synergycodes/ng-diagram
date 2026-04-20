---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "LinkingActionState"
---

State tracking an edge creation operation in progress.

## Properties

### cancelReason?

> `optional` **cancelReason**: [`EdgeDrawCancelReason`](/docs/api/types/events/edgedrawcancelreason/)

Reason the linking gesture was cancelled (set by finishLinking on failure paths).

***

### dropPosition?

> `optional` **dropPosition**: [`Point`](/docs/api/types/geometry/point/)

Position where the pointer was released.

***

### sourceNodeId

> **sourceNodeId**: `string`

ID of the node where the edge starts.

***

### sourcePortId

> **sourcePortId**: `string`

ID of the port where the edge starts.

***

### temporaryEdge

> **temporaryEdge**: `null` \| [`Edge`](/docs/api/types/model/edge/)\<`object`\>

Temporary edge displayed while creating the connection.
