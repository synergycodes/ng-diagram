---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "getNearestDanglingEndpointInRange"
---

> **getNearestDanglingEndpointInRange**(`edges`, `point`, `range`): `null` \| [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)

Finds the free edge endpoint nearest to `point` within `range`, or `null`
when none is close enough. It works like `getNearestPortInRange`, but for
the free endpoints of dangling edges. Temporary and effectively hidden edges
are skipped.

## Parameters

### edges

readonly [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

The edges to scan.

### point

[`Point`](/docs/api/types/geometry/point/)

The point to measure from.

### range

`number`

The maximum distance from `point`.

## Returns

`null` \| [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)

The nearest free endpoint, or `null`.
