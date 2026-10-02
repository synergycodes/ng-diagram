---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "getDanglingEndpoints"
---

> **getDanglingEndpoints**(`edges`): [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)[]

Collects the free endpoints of the given edges. A dual dangling edge gives
two entries. Endpoints without an anchor position are skipped, because they
cannot be rendered or snapped to. Temporary and effectively hidden edges are
skipped as well.

## Parameters

### edges

readonly [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

The edges to scan.

## Returns

[`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)[]

The free endpoints with their edge, end and anchor position.
