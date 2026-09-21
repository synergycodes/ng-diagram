---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "computeDetachAnchor"
---

> **computeDetachAnchor**(`edge`, `end`, `node`): `null` \| [`Point`](/docs/api/types/geometry/point/)

Computes the position where a detached endpoint stays: the current position
of the port when the edge was connected to a port, otherwise the routed
endpoint of the edge, or the center of the node as a last resort. Call it
while the node still exists in the model.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

The edge whose endpoint is being detached.

### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

The endpoint to detach.

### node

The node the endpoint is connected to, if it still exists.

`undefined` | `null` | [`Node`](/docs/api/types/model/node/)

## Returns

`null` \| [`Point`](/docs/api/types/geometry/point/)

The anchor position, or `null` when none can be computed.
