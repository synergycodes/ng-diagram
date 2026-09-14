---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "getDanglingEndpoints"
---

> **getDanglingEndpoints**(`edges`): [`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)[]

Collects the free endpoints of the given edges. A dual dangling edge yields
two entries. Endpoints whose anchor position is missing are skipped —
they cannot be rendered or snapped to.

## Parameters

### edges

readonly [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

## Returns

[`DanglingEndpoint`](/docs/api/types/model/danglingendpoint/)[]
