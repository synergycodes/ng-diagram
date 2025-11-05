---
editUrl: false
next: false
prev: false
title: "MiddlewareHelpers"
---

Helper functions for checking what changed during middleware execution.
These helpers track all cumulative changes from the initial action and all previous middlewares.

## Properties

### anyEdgesAdded()

> **anyEdgesAdded**: () => `boolean`

Checks if any edges were added.

#### Returns

`boolean`

true if at least one edge was added

***

### anyEdgesRemoved()

> **anyEdgesRemoved**: () => `boolean`

Checks if any edges were removed.

#### Returns

`boolean`

true if at least one edge was removed

***

### anyNodesAdded()

> **anyNodesAdded**: () => `boolean`

Checks if any nodes were added.

#### Returns

`boolean`

true if at least one node was added

***

### anyNodesRemoved()

> **anyNodesRemoved**: () => `boolean`

Checks if any nodes were removed.

#### Returns

`boolean`

true if at least one node was removed

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

true if any edge has any of these properties modified

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

true if any node has any of these properties modified

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

true if the edge was added during this middleware chain

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

true if the edge was modified (any property changed)

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

true if the edge was removed during this middleware chain

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

true if the node was added during this middleware chain

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

true if the node was modified (any property changed)

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

true if the node was removed during this middleware chain

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

Array of edge IDs that have any of these properties modified

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

Array of node IDs that have any of these properties modified
