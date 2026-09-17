---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "isEdgeEndRelinkable"
---

> **isEdgeEndRelinkable**(`edge`, `end`, `defaultRelinkable`): `boolean`

Whether the user can relink the given end of the edge: the edge's own
`relinkable` when set, otherwise `defaultRelinkable` from the linking config.
`true` allows both ends, an `EdgeEnd` only that end, any other value neither.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

### defaultRelinkable

`boolean` | [`EdgeEnd`](/docs/api/types/model/edgeend/)

## Returns

`boolean`
