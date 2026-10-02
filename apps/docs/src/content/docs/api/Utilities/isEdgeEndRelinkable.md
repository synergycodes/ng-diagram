---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "isEdgeEndRelinkable"
---

> **isEdgeEndRelinkable**(`edge`, `end`, `defaultRelinkable`): `boolean`

Returns whether the user can relink the given end of an edge. It uses the
edge's own `relinkable` value when set, otherwise `defaultRelinkable` from
the linking config. `true` allows both ends, `'source'` or `'target'` allows
only that end, and any other value allows neither.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

The edge to check.

### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

The endpoint to check.

### defaultRelinkable

The `linking.defaultRelinkable` config value.

`boolean` | [`EdgeEnd`](/docs/api/types/model/edgeend/)

## Returns

`boolean`

`true` when the user can relink that end.
