---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "hasFreeEndpoint"
---

> **hasFreeEndpoint**(`edge`, `end?`): `boolean`

Checks whether the given endpoint of an edge is free (not connected to a
node). A free endpoint is represented by an empty `source`/`target` with the
position stored in `sourcePosition`/`targetPosition`.

When `end` is omitted, checks whether either endpoint is free.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

### end?

[`EdgeEnd`](/docs/api/types/model/edgeend/)

## Returns

`boolean`
