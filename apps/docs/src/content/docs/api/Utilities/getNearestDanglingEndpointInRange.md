---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "getNearestDanglingEndpointInRange"
---

> **getNearestDanglingEndpointInRange**(`edges`, `point`, `range`): `null` \| [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)

Finds the free edge endpoint nearest to `point` within `range`, or null when
none is close enough. Sibling of `getNearestPortInRange` for snapping to
dangling ends. Temporary and effectively hidden edges are skipped.

## Parameters

### edges

readonly [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

### point

[`Point`](/docs/api/types/geometry/point/)

### range

`number`

## Returns

`null` \| [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)
