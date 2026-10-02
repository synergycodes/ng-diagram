---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "DanglingEdgesConfig"
---

Configuration for dangling edges: edges with one or both endpoints not
connected to any node. A free endpoint has an empty `source` or `target`,
and its position is stored in `sourcePosition` or `targetPosition`.

The feature is off by default: an edge dropped on empty canvas is
discarded, and deleting a node deletes its edges.

## Properties

### detachOnNodeDelete

> **detachOnNodeDelete**: `boolean`

When true, deleting a node keeps its edges as dangling edges instead of
deleting them. Each freed endpoint stays anchored where its port was.
Requires `enabled` to be true.

An edge is still deleted, not detached, in these cases:
- The edge itself is part of the deleted selection. An explicit delete
  always wins.
- The edge is hidden only because of the node it loses, for example the
  edges of the collapsed children of a deleted group. Detaching it would
  turn invisible wiring into a visible dangling edge. An edge that is
  hidden for another reason (its own `hidden` flag, a template binding,
  or a hidden node at the other end) is detached like any other edge and
  stays hidden.
- The edge loses both endpoints in the same delete. It becomes a dual
  dangling edge only when [shouldDetachOnNodeDelete](/docs/api/types/configuration/features/danglingedgesconfig/#shoulddetachonnodedelete) is provided
  and returns true for both ends.

#### Default

```ts
false
```

***

### enabled

> **enabled**: `boolean`

Master switch for dangling edges. When true, an edge drawn onto empty
canvas is kept as a dangling edge instead of being discarded, and a
relink dropped on empty canvas detaches that endpoint. It also enables
`detachEdge` and `startLinkingFromPosition`.

A drop on a port that the edge cannot connect to (for example a port
with the wrong direction) does not count as a drop on empty canvas. Such
a draw is discarded and such a relink is reverted.

#### Default

```ts
false
```

***

### shouldDetachOnNodeDelete()?

> `optional` **shouldDetachOnNodeDelete**: (`edge`, `deletedNode`, `end`) => `boolean`

Decides per endpoint whether it is detached (kept as a free endpoint) or
deleted together with the node. Called only when `enabled` and
`detachOnNodeDelete` are true, once for each endpoint that loses its
node. Returning false deletes the edge. An edge that loses both
endpoints at once survives as a dual dangling edge only when this
callback is provided and returns true for both ends.

#### Parameters

##### edge

[`Edge`](/docs/api/types/model/edge/)

The edge that loses a node.

##### deletedNode

[`Node`](/docs/api/types/model/node/)

The node being deleted.

##### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

The endpoint of `edge` that is connected to `deletedNode`.

#### Returns

`boolean`

#### Default

```ts
undefined (detach every edge, except edges losing both ends)
```

***

### shouldKeepOnDrop()?

> `optional` **shouldKeepOnDrop**: (`edge`, `dropPosition`) => `boolean`

Decides per edge whether a draw or relink dropped on empty canvas keeps
the edge as a dangling edge. Called only when `enabled` is true. For a
draw, `edge` is the final edge, after `linking.finalEdgeDataBuilder` has
run. For a relink, `edge` is the edge as it would be after the detach.
Returning false discards the drawn edge or reverts the relink, which is
also what happens when the feature is off.

#### Parameters

##### edge

[`Edge`](/docs/api/types/model/edge/)

The edge that would be kept.

##### dropPosition

[`Point`](/docs/api/types/geometry/point/)

The position where the pointer was released, in flow coordinates.

#### Returns

`boolean`

#### Default

```ts
undefined (keep every edge)
```
