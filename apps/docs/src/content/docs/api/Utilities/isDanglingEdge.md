---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "isDanglingEdge"
---

> **isDanglingEdge**(`edge`): `boolean`

Checks whether an edge is dangling, that is, whether at least one of its
endpoints is not connected to a node. An edge with both endpoints free is a
dual dangling edge.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

The edge to check.

## Returns

`boolean`

`true` when at least one endpoint is free.
