---
editUrl: false
next: false
prev: false
title: "LinkingConfig"
---

Configuration for linking (edge creation) behavior.

## Properties

### finalEdgeDataBuilder()

> **finalEdgeDataBuilder**: (`defaultFinalEdgeData`) => [`Edge`](/docs/api/types/edge/)

Allows customization of the final edge object when the user completes edge creation.
Receives the default finalized edge (with source/target node/port IDs)
and should return a fully-formed Edge object to be added to the flow.

#### Parameters

##### defaultFinalEdgeData

[`Edge`](/docs/api/types/edge/)

The default finalized edge data (may be incomplete).

#### Returns

[`Edge`](/docs/api/types/edge/)

The Edge object to use for the finalized edge.

#### Default

```ts
() => Edge
```

***

### portSnapDistance

> **portSnapDistance**: `number`

The maximum distance (in pixels) at temporary edge will snap to target port.

#### Default

```ts
10
```

***

### temporaryEdgeDataBuilder()

> **temporaryEdgeDataBuilder**: (`defaultTemporaryEdgeData`) => [`Edge`](/docs/api/types/edge/)

Allows customization of the temporary edge object shown while the user is dragging to create a new edge.
Receives the default temporary edge (with source/target node/port IDs and positions)
and should return a fully-formed Edge object for rendering the temporary edge.

#### Parameters

##### defaultTemporaryEdgeData

[`Edge`](/docs/api/types/edge/)

The default temporary edge data (may be incomplete).

#### Returns

[`Edge`](/docs/api/types/edge/)

The Edge object to use for the temporary edge.

#### Default

```ts
() => Edge
```

***

### validateConnection()

> **validateConnection**: (`source`, `sourcePort`, `target`, `targetPort`) => `boolean`

Validates whether a connection between two nodes and ports is allowed.

#### Parameters

##### source

The source node.

`null` | [`Node`](/docs/api/types/node/)

##### sourcePort

The source port.

`null` | [`Port`](/docs/api/types/port/)

##### target

The target node.

`null` | [`Node`](/docs/api/types/node/)

##### targetPort

The target port.

`null` | [`Port`](/docs/api/types/port/)

#### Returns

`boolean`

True if the connection is valid, false otherwise.

#### Default

```ts
() => true
```
