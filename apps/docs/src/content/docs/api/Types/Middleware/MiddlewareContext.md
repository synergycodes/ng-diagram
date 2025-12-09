---
version: "since v0.8.0"
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

    // Check what actions triggered this (supports transactions with multiple actions)
    if (context.modelActionTypes.includes('addNodes')) {
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

> **actionStateManager**: [`ActionStateManager`](/docs/api/internals/actionstatemanager/)

Manager for action states (resizing, linking, etc.)

***

### config

> **config**: [`FlowConfig`](/docs/api/types/configuration/flowconfig/)

The current diagram configuration

***

### edgeRoutingManager

> **edgeRoutingManager**: [`EdgeRoutingManager`](/docs/api/internals/edgeroutingmanager/)

Manager for edge routing algorithms

***

### edgesMap

> **edgesMap**: `Map`\<`string`, [`Edge`](/docs/api/types/model/edge/)\<`object`\>\>

Map for quick edge lookup by ID.
Contains the current state after previous middleware processing.
Use this to access edges by ID instead of iterating through `state.edges`.

***

### environment

> **environment**: [`EnvironmentInfo`](/docs/api/internals/environmentinfo/)

Environment information (browser, rendering engine, etc.)

***

### helpers

> **helpers**: [`MiddlewareHelpers`](/docs/api/types/middleware/middlewarehelpers/)

Helper functions to check what changed (tracks all cumulative changes from the initial action and all previous middlewares)

***

### history

> **history**: [`MiddlewareHistoryUpdate`](/docs/api/types/middleware/middlewarehistoryupdate/)[]

All state updates from previous middlewares in the chain

***

### initialEdgesMap

> **initialEdgesMap**: `Map`\<`string`, [`Edge`](/docs/api/types/model/edge/)\<`object`\>\>

The initial edges map before any modifications (before the initial action and before any middleware modifications).
Use this to compare state before and after all modifications.
Common usage: Access removed edge instances that no longer exist in `edgesMap`.

***

### initialNodesMap

> **initialNodesMap**: `Map`\<`string`, [`Node`](/docs/api/types/model/node/)\>

The initial nodes map before any modifications (before the initial action and before any middleware modifications).
Use this to compare state before and after all modifications.
Common usage: Access removed node instances that no longer exist in `nodesMap`.

***

### initialState

> **initialState**: [`FlowState`](/docs/api/types/model/flowstate/)

The state before any modifications (before the initial action and before any middleware modifications)

***

### initialUpdate

> **initialUpdate**: [`FlowStateUpdate`](/docs/api/types/middleware/flowstateupdate/)

The initial state update that triggered the middleware chain.
Middlewares can add their own updates to the state, so this may not contain all modifications
that will be applied. Use `helpers` to get actual knowledge about all changes.

***

### ~~modelActionType~~

> **modelActionType**: [`ModelActionType`](/docs/api/types/middleware/modelactiontype/)

The action that triggered the middleware execution.

:::caution[Deprecated]
Use `modelActionTypes` instead, which supports multiple actions from transactions.
For single actions, this returns the first (and only) action type.
:::

***

### modelActionTypes

> **modelActionTypes**: [`ModelActionTypes`](/docs/api/types/middleware/modelactiontypes/)

All action types that triggered the middleware execution.
For transactions, this contains the transaction name followed by all action types
from commands executed within the transaction.
For single commands outside transactions, this is a single-element array.

#### Example

```typescript
// For a transaction named 'batchUpdate' with addNodes and moveViewport commands:
// modelActionTypes = ['batchUpdate', 'addNodes', 'moveViewport']

// For a single command outside a transaction:
// modelActionTypes = ['addNodes']
```

#### Since

0.9.0

***

### nodesMap

> **nodesMap**: `Map`\<`string`, [`Node`](/docs/api/types/model/node/)\>

Map for quick node lookup by ID.
Contains the current state after previous middleware processing.
Use this to access nodes by ID instead of iterating through `state.nodes`.

***

### state

> **state**: [`FlowState`](/docs/api/types/model/flowstate/)

The current state (includes the initial modification and all changes from previous middlewares)
