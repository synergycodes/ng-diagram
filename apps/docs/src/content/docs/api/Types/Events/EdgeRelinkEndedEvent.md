---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkEndedEvent"
---

Event payload emitted when an edge relink gesture ends, regardless of outcome.

On success the edge was either reconnected (`target`/`targetPort` populated)
or left dangling (`edge` has an empty endpoint anchored at `dropPosition`).
On failure the edge is unchanged and `reason` explains why.

## Properties

### dropPosition

> **dropPosition**: [`Point`](/docs/api/types/geometry/point/)

The position where the pointer was released.

***

### edge

> **edge**: [`Edge`](/docs/api/types/model/edge/)

The edge after the relink (unchanged snapshot when `success` is false).

***

### end

> **end**: [`EdgeEnd`](/docs/api/types/model/edgeend/)

Which endpoint was dragged.

***

### previousNode?

> `optional` **previousNode**: [`Node`](/docs/api/types/model/node/)

The node the endpoint was connected to before the relink, if any.

***

### previousPort?

> `optional` **previousPort**: `string`

The port the endpoint was connected to before the relink, if any.

***

### previousPosition?

> `optional` **previousPosition**: [`Point`](/docs/api/types/geometry/point/)

The dangling position the endpoint had before the relink, if it was dangling.

***

### reason?

> `optional` **reason**: [`EdgeRelinkCancelReason`](/docs/api/types/events/edgerelinkcancelreason/)

The reason the relink was reverted (only present on failure).

***

### success

> **success**: `boolean`

Whether the edge was changed (reconnected or left dangling).

***

### target?

> `optional` **target**: [`Node`](/docs/api/types/model/node/)

The node the endpoint was reconnected to (only present on reconnect).

***

### targetPort?

> `optional` **targetPort**: `string`

The port the endpoint was reconnected to (only present on reconnect).
