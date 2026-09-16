---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "DanglingEdgesConfig"
---

Configuration for dangling edges — edges with one or both endpoints not
connected to any node (an empty `source`/`target` with the free end anchored
at `sourcePosition`/`targetPosition`).

Everything here is opt-in; with the defaults the diagram behaves exactly as
before: a link drop on empty canvas discards the edge and deleting a node
deletes its edges.

## Properties

### detachOnNodeDelete

> **detachOnNodeDelete**: `boolean`

When true, edges connected to a deleted node are detached into dangling
edges — anchored where their port was — instead of being deleted.
Requires `enabled` to be true.

An edge is still deleted, never detached, when:
- it is itself part of the deleted selection (an explicit delete wins),
- it or the lost endpoint's node is effectively hidden (detaching would
  materialize invisible wiring as visible dangling edges), or
- it loses BOTH endpoints in the same delete — it becomes a dual dangling
  edge only when [shouldDetachOnNodeDelete](/docs/api/types/configuration/features/danglingedgesconfig/#shoulddetachonnodedelete) is provided and returns
  true for both ends.

#### Default

```ts
false
```

***

### enabled

> **enabled**: `boolean`

Master switch for dangling edges. When true, an edge draw that ends on
empty canvas keeps the edge as a dangling edge instead of discarding it,
and an edge relink dropped on empty canvas detaches that endpoint.

#### Default

```ts
false
```

***

### shouldDetachOnNodeDelete()?

> `optional` **shouldDetachOnNodeDelete**: (`edge`, `deletedNode`, `end`) => `boolean`

Per-edge decision whether a given endpoint is detached (kept dangling) or
deleted along with the node. Called only when `enabled` and
`detachOnNodeDelete` are true, once per endpoint losing its node.
Returning false deletes the edge. For an edge losing both endpoints at
once, the edge survives as a dual dangling edge only when this callback
is provided and returns true for both ends.

#### Parameters

##### edge

[`Edge`](/docs/api/types/model/edge/)

##### deletedNode

[`Node`](/docs/api/types/model/node/)

##### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

#### Returns

`boolean`

#### Default

```ts
undefined (detach every edge, except edges losing both ends)
```

***

### shouldKeepOnDrop()?

> `optional` **shouldKeepOnDrop**: (`edge`, `dropPosition`) => `boolean`

Per-edge decision whether a link dropped on empty canvas is kept as a
dangling edge. Called only when `enabled` is true. The edge passed in is
the fully-built final edge (after `linking.finalEdgeDataBuilder`).
Returning false discards the edge (the default behavior when the feature
is off).

#### Parameters

##### edge

[`Edge`](/docs/api/types/model/edge/)

##### dropPosition

[`Point`](/docs/api/types/geometry/point/)

#### Returns

`boolean`

#### Default

```ts
undefined (keep every edge)
```
