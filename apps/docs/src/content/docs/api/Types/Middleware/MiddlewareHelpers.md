---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "MiddlewareHelpers"
---

Helper functions for checking what changed during middleware execution.
These helpers track all cumulative changes from the initial state update and all previous middlewares.

## Properties

### anyEdgesAdded()

> **anyEdgesAdded**: () => `boolean`

Checks if any edges were added.

#### Returns

`boolean`

true if at least one edge was added by the initial state update or any previous middleware

***

### anyEdgesRemoved()

> **anyEdgesRemoved**: () => `boolean`

Checks if any edges were removed.

#### Returns

`boolean`

true if at least one edge was removed by the initial state update or any previous middleware

***

### anyNodesAdded()

> **anyNodesAdded**: () => `boolean`

Checks if any nodes were added.

#### Returns

`boolean`

true if at least one node was added by the initial state update or any previous middleware

***

### anyNodesRemoved()

> **anyNodesRemoved**: () => `boolean`

Checks if any nodes were removed.

#### Returns

`boolean`

true if at least one node was removed by the initial state update or any previous middleware

***

### checkIfAnyEdgePropsChanged()

> **checkIfAnyEdgePropsChanged**: (`props`) => `boolean`

Checks if any edge has one or more of the specified properties changed.

#### Parameters

##### props

`string`[]

Array of property names to check (e.g., ['sourcePosition', 'targetPosition'])

#### Returns

`boolean`

true if any edge has any of these properties modified by the initial state update or any previous middleware

***

### checkIfAnyNodePropsChanged()

> **checkIfAnyNodePropsChanged**: (`props`) => `boolean`

Checks if any node has one or more of the specified properties changed.

#### Parameters

##### props

`string`[]

Array of property names to check (e.g., ['position', 'size'])

#### Returns

`boolean`

true if any node has any of these properties modified by the initial state update or any previous middleware

***

### checkIfEdgeAdded()

> **checkIfEdgeAdded**: (`id`) => `boolean`

Checks if a specific edge was added.

#### Parameters

##### id

`string`

The edge ID to check

#### Returns

`boolean`

true if the edge was added by the initial state update or any previous middleware

***

### checkIfEdgeChanged()

> **checkIfEdgeChanged**: (`id`) => `boolean`

Checks if a specific edge has been modified.

#### Parameters

##### id

`string`

The edge ID to check

#### Returns

`boolean`

true if the edge was modified (any property changed) by the initial state update or any previous middleware

***

### checkIfEdgeRemoved()

> **checkIfEdgeRemoved**: (`id`) => `boolean`

Checks if a specific edge was removed.

#### Parameters

##### id

`string`

The edge ID to check

#### Returns

`boolean`

true if the edge was removed by the initial state update or any previous middleware

***

### checkIfNodeAdded()

> **checkIfNodeAdded**: (`id`) => `boolean`

Checks if a specific node was added.

#### Parameters

##### id

`string`

The node ID to check

#### Returns

`boolean`

true if the node was added by the initial state update or any previous middleware

***

### checkIfNodeChanged()

> **checkIfNodeChanged**: (`id`) => `boolean`

Checks if a specific node has been modified.

#### Parameters

##### id

`string`

The node ID to check

#### Returns

`boolean`

true if the node was modified (any property changed) by the initial state update or any previous middleware

***

### checkIfNodeRemoved()

> **checkIfNodeRemoved**: (`id`) => `boolean`

Checks if a specific node was removed.

#### Parameters

##### id

`string`

The node ID to check

#### Returns

`boolean`

true if the node was removed by the initial state update or any previous middleware

***

### getAddedEdges()

> **getAddedEdges**: () => [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Gets all edges that were added.

#### Returns

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Array of edge instances that were added by the initial state update or any previous middleware

***

### getAddedNodes()

> **getAddedNodes**: () => [`Node`](/docs/api/types/model/node/)[]

Gets all nodes that were added.

#### Returns

[`Node`](/docs/api/types/model/node/)[]

Array of node instances that were added by the initial state update or any previous middleware

***

### getAffectedEdgeIds()

> **getAffectedEdgeIds**: (`props`) => `string`[]

Gets all edge IDs that have one or more of the specified properties changed.

#### Parameters

##### props

`string`[]

Array of property names to check (e.g., ['sourcePosition', 'targetPosition'])

#### Returns

`string`[]

Array of edge IDs that have any of these properties modified by the initial state update or any previous middleware

***

### getAffectedNodeIds()

> **getAffectedNodeIds**: (`props`) => `string`[]

Gets all node IDs that have one or more of the specified properties changed.

#### Parameters

##### props

`string`[]

Array of property names to check (e.g., ['position', 'size'])

#### Returns

`string`[]

Array of node IDs that have any of these properties modified by the initial state update or any previous middleware

***

### getRemovedEdges()

> **getRemovedEdges**: () => [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Gets all edges that were removed.
Uses `initialEdgesMap` to access the removed instances.

#### Returns

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Array of edge instances that were removed by the initial state update or any previous middleware

***

### getRemovedNodes()

> **getRemovedNodes**: () => [`Node`](/docs/api/types/model/node/)[]

Gets all nodes that were removed.
Uses `initialNodesMap` to access the removed instances.

#### Returns

[`Node`](/docs/api/types/model/node/)[]

Array of node instances that were removed by the initial state update or any previous middleware
