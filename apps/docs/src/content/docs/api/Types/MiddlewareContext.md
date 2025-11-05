---
editUrl: false
next: false
prev: false
title: "MiddlewareContext"
---

The context object passed to middleware execute functions.
Provides access to the current state, helper functions, and configuration.

## Example

```typescript
const middleware: Middleware = {
  name: 'validation',
  execute: (context, next, cancel) => {
    // Check if any nodes were added
    if (context.helpers.anyNodesAdded()) {
      console.log('Nodes added:', context.state.nodes);
    }

    // Access configuration
    console.log('Cell size:', context.config.background.cellSize);

    // Check what action triggered this
    if (context.modelActionType === 'addNodes') {
      // Validate new nodes
      const isValid = validateNodes(context.state.nodes);
      if (!isValid) {
        cancel(); // Block the operation
        return;
      }
    }

    next(); // Continue to next middleware
  }
};
```

## Properties

### actionStateManager

> **actionStateManager**: [`ActionStateManager`](/docs/api/other/actionstatemanager/)

Manager for action states (resizing, linking, etc.)

***

### config

> **config**: [`FlowConfig`](/docs/api/types/flowconfig/)

The current diagram configuration

***

### edgeRoutingManager

> **edgeRoutingManager**: [`EdgeRoutingManager`](/docs/api/other/edgeroutingmanager/)

Manager for edge routing algorithms

***

### edgesMap

> **edgesMap**: `Map`\<`string`, [`Edge`](/docs/api/types/edge/)\<`object`\>\>

Map for quick edge lookup by ID.
Contains the current state after previous middleware processing.
Use this to access edges by ID instead of iterating through `state.edges`.

***

### environment

> **environment**: [`EnvironmentInfo`](/docs/api/types/environmentinfo/)

Environment information (browser, rendering engine, etc.)

***

### helpers

> **helpers**: `object`

Helper functions to check what changed

#### anyEdgesAdded()

> **anyEdgesAdded**: () => `boolean`

##### Returns

`boolean`

#### anyEdgesRemoved()

> **anyEdgesRemoved**: () => `boolean`

##### Returns

`boolean`

#### anyNodesAdded()

> **anyNodesAdded**: () => `boolean`

##### Returns

`boolean`

#### anyNodesRemoved()

> **anyNodesRemoved**: () => `boolean`

##### Returns

`boolean`

#### checkIfAnyEdgePropsChanged()

> **checkIfAnyEdgePropsChanged**: (`props`) => `boolean`

##### Parameters

###### props

`string`[]

##### Returns

`boolean`

#### checkIfAnyNodePropsChanged()

> **checkIfAnyNodePropsChanged**: (`props`) => `boolean`

##### Parameters

###### props

`string`[]

##### Returns

`boolean`

#### checkIfEdgeAdded()

> **checkIfEdgeAdded**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### checkIfEdgeChanged()

> **checkIfEdgeChanged**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### checkIfEdgeRemoved()

> **checkIfEdgeRemoved**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### checkIfNodeAdded()

> **checkIfNodeAdded**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### checkIfNodeChanged()

> **checkIfNodeChanged**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### checkIfNodeRemoved()

> **checkIfNodeRemoved**: (`id`) => `boolean`

##### Parameters

###### id

`string`

##### Returns

`boolean`

#### getAffectedEdgeIds()

> **getAffectedEdgeIds**: (`props`) => `string`[]

##### Parameters

###### props

`string`[]

##### Returns

`string`[]

#### getAffectedNodeIds()

> **getAffectedNodeIds**: (`props`) => `string`[]

##### Parameters

###### props

`string`[]

##### Returns

`string`[]

***

### history

> **history**: [`MiddlewareHistoryUpdate`](/docs/api/types/middlewarehistoryupdate/)[]

All state updates from previous middlewares in the chain

***

### initialEdgesMap

> **initialEdgesMap**: `Map`\<`string`, [`Edge`](/docs/api/types/edge/)\<`object`\>\>

The initial edges map before any modifications (before the initial action and before any middleware modifications).
Use this to compare state before and after all modifications.
Common usage: Access removed edge instances that no longer exist in `edgesMap`.

***

### initialNodesMap

> **initialNodesMap**: `Map`\<`string`, [`Node`](/docs/api/types/node/)\>

The initial nodes map before any modifications (before the initial action and before any middleware modifications).
Use this to compare state before and after all modifications.
Common usage: Access removed node instances that no longer exist in `nodesMap`.

***

### initialState

> **initialState**: [`FlowState`](/docs/api/types/flowstate/)

The state before any modifications (before the initial action and before any middleware modifications)

***

### initialUpdate

> **initialUpdate**: [`FlowStateUpdate`](/docs/api/types/flowstateupdate/)

The initial state update that triggered the middleware chain.
Middlewares can add their own updates to the state, so this may not contain all modifications
that will be applied. Use `helpers` to get actual knowledge about all changes.

***

### modelActionType

> **modelActionType**: [`ModelActionType`](/docs/api/types/modelactiontype/)

The action that triggered the middleware execution

***

### nodesMap

> **nodesMap**: `Map`\<`string`, [`Node`](/docs/api/types/node/)\>

Map for quick node lookup by ID.
Contains the current state after previous middleware processing.
Use this to access nodes by ID instead of iterating through `state.nodes`.

***

### state

> **state**: [`FlowState`](/docs/api/types/flowstate/)

The current state (includes the initial modification and all changes from previous middlewares)
