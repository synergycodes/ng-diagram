---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkingConfig"
---

Configuration for interactive edge relinking — dragging an endpoint of an
existing edge to reconnect it to another port or leave it dangling.

## Properties

### enabled

> **enabled**: `boolean`

Enables the relinking gesture. When true, a selected edge shows grabbable
endpoint handles; dragging one previews the reconnection live and commits
it on drop. Dropping on empty canvas leaves the endpoint dangling when
`danglingEdges.enabled` is true, otherwise the relink is reverted.

#### Default

```ts
false
```

***

### validateRelink()?

> `optional` **validateRelink**: (`edge`, `end`, `targetNode`, `targetPort`) => `boolean`

Validates a relink drop. Receives the edge being relinked, which endpoint
is dragged, and the candidate node/port under the pointer.
When not provided, `linking.validateConnection` is used with the edge's
endpoints in their proper roles.

#### Parameters

##### edge

[`Edge`](/docs/api/types/model/edge/)

##### end

[`EdgeEnd`](/docs/api/types/model/edgeend/)

##### targetNode

`null` | [`Node`](/docs/api/types/model/node/)

##### targetPort

`null` | [`Port`](/docs/api/types/model/port/)

#### Returns

`boolean`

#### Default

```ts
undefined (falls back to linking.validateConnection)
```
