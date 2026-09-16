---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "computeDetachAnchor"
---

> **computeDetachAnchor**(`edge`, `end`, `node`): `null` \| [`Point`](/docs/api/types/geometry/point/)

Computes the anchor a detached endpoint stays at: the port's current flow
position when the edge was connected to a port, the edge's routed endpoint
otherwise, the node's center as a last resort. Must run while the node is
still in the state.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

### node

`undefined` | `null` | [`Node`](/docs/api/types/model/node/)

## Returns

`null` \| [`Point`](/docs/api/types/geometry/point/)
