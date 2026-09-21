---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "LinkingConfig"
---

Configuration for linking (edge creation) behavior.

## Properties

### defaultRelinkable

> **defaultRelinkable**: `boolean` \| [`EdgeEnd`](/docs/api/types/model/edgeend/)

Default `relinkable` value for edges that do not set their own. `true`
lets the user drag both ends of an edge to another port, `'source'` or
`'target'` allows only that end, and `false` allows neither. A selected
edge shows a handle at each end that can be relinked. Dragging a handle
previews the new connection and commits it on drop. A drop on empty
canvas detaches the endpoint when `danglingEdges.enabled` is true;
otherwise the relink is reverted.

Relinking uses the same `portSnapDistance`, edge panning and
`temporaryEdgeDataBuilder` settings as edge drawing. Each drop is
validated with `validateConnection`, which receives a context with
`reason: 'relink'` and the edge being relinked.

#### Default

```ts
false
```

#### Since

1.4.0

***

### edgePanningEnabled

> **edgePanningEnabled**: `boolean`

Enable edge panning when the routed edge is near the edge of the viewport.

#### Default

```ts
true
```

***

### edgePanningForce

> **edgePanningForce**: `number`

Multiplier for edge panning speed while routing edge is near the edge of the viewport.

#### Default

```ts
10
```

***

### edgePanningThreshold

> **edgePanningThreshold**: `number`

The threshold in pixels for edge panning to start.
If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.

#### Default

```ts
30
```

***

### finalEdgeDataBuilder()

> **finalEdgeDataBuilder**: (`defaultFinalEdgeData`) => [`Edge`](/docs/api/types/model/edge/)

Allows customization of the final edge object when the user completes edge creation.
Receives the default finalized edge (with source/target node/port IDs)
and should return a fully-formed Edge object to be added to the flow.

#### Parameters

##### defaultFinalEdgeData

[`Edge`](/docs/api/types/model/edge/)

The default finalized edge data (may be incomplete).

#### Returns

[`Edge`](/docs/api/types/model/edge/)

The Edge object to use for the finalized edge.

#### Default

```ts
(edge) => Edge
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

### selectNodeOnPortPress

> **selectNodeOnPortPress**: `boolean`

Whether to select a node when the user presses a port to start linking.
When true (default), pressing a port also triggers node selection events.
When false, port press only initiates the linking gesture without selecting the node.

#### Default

```ts
true
```

#### Since

1.2.0

***

### temporaryEdgeDataBuilder()

> **temporaryEdgeDataBuilder**: (`defaultTemporaryEdgeData`) => [`Edge`](/docs/api/types/model/edge/)

Allows customization of the temporary edge object shown while the user is dragging to create a new edge.
Receives the default temporary edge (with source/target node/port IDs and positions)
and should return a fully-formed Edge object for rendering the temporary edge.

#### Parameters

##### defaultTemporaryEdgeData

[`Edge`](/docs/api/types/model/edge/)

The default temporary edge data (may be incomplete).

#### Returns

[`Edge`](/docs/api/types/model/edge/)

The Edge object to use for the temporary edge.

#### Default

```ts
(edge) => Edge
```

***

### validateConnection()

> **validateConnection**: (`source`, `sourcePort`, `target`, `targetPort`, `context?`) => `boolean`

Validates whether a connection between two nodes and ports is allowed.

Called for every operation that creates a connection: drawing a new edge,
relinking an endpoint of an existing edge, and `attachEdge`. The optional
`context` tells which operation is being validated (since 1.4.0).

`source` is `null` for draws started with `startLinkingFromPosition`.
When an edge is relinked or attached, the other end of that edge can be
free (dangling); the `source` or `target` for that end is then `null`.

#### Parameters

##### source

The source node, or `null` when the source end is free.

`null` | [`Node`](/docs/api/types/model/node/)

##### sourcePort

The source port.

`null` | [`Port`](/docs/api/types/model/port/)

##### target

The target node, or `null` when the target end is free.

`null` | [`Node`](/docs/api/types/model/node/)

##### targetPort

The target port.

`null` | [`Port`](/docs/api/types/model/port/)

##### context?

[`ConnectionValidationContext`](/docs/api/types/configuration/features/connectionvalidationcontext/)

The operation being validated (`draw` when omitted).

#### Returns

`boolean`

True if the connection is valid, false otherwise.

#### Default

```ts
() => true
```
