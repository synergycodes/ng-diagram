---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "hasFreeEndpoint"
---

> **hasFreeEndpoint**(`edge`, `end?`): `boolean`

Checks whether the given endpoint of an edge is free (not connected to a
node). A free endpoint has an empty `source` or `target`, and its position
is stored in `sourcePosition` or `targetPosition`.

When `end` is omitted, checks whether either endpoint is free.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

The edge to check.

### end?

[`EdgeEnd`](/docs/api/types/model/edgeend/)

The endpoint to check, or none to check both.

## Returns

`boolean`

`true` when the endpoint is free.
