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

### relink?

> `optional` **relink**: [`LinkingRelinkContext`](/docs/api/internals/linkingrelinkcontext/)

Present while an existing edge's endpoint is being relinked. The original
edge is hidden and represented by the temporary edge until the gesture
ends; `relink.end` is the end of the temporary edge that follows the
pointer (a normal draw always drags the target end).

#### Since

1.4.0

***

### relinkCancelReason?

> `optional` **relinkCancelReason**: [`EdgeRelinkCancelReason`](/docs/api/types/events/edgerelinkcancelreason/)

Reason the relink gesture ended without changing the edge (set by finishRelinking on failure paths).

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
