---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "Middleware"
---

Middleware interface for intercepting and modifying diagram state changes.

Middlewares form a chain where each can:
- Inspect the current state and action type
- Modify the state by passing updates to `next()`
- Block operations by calling `cancel()`
- Perform side effects (logging, validation, etc.)

## Example

```typescript
// Read-only middleware that blocks modifications
const readOnlyMiddleware: Middleware<'read-only'> = {
  name: 'read-only',
  execute: (context, next, cancel) => {
    const blockedActions = ['addNodes', 'deleteNodes', 'updateNode'];
    if (context.modelActionTypes.some((action) => blockedActions.includes(action))) {
      console.warn('Action blocked in read-only mode');
      cancel();
      return;
    }
    next();
  }
};

// Auto-snap middleware that modifies positions
const snapMiddleware: Middleware<'auto-snap'> = {
  name: 'auto-snap',
  execute: (context, next) => {
    const gridSize = 20;
    const nodesToSnap = context.helpers.getAffectedNodeIds(['position']);

    const updates = nodesToSnap.map(id => {
      const node = context.nodesMap.get(id)!;
      return {
        id,
        position: {
          x: Math.round(node.position.x / gridSize) * gridSize,
          y: Math.round(node.position.y / gridSize) * gridSize
        }
      };
    });

    next({ nodesToUpdate: updates });
  }
};

// Register middleware
ngDiagramService.registerMiddleware(snapMiddleware);
```

## Type Parameters

### TName

`TName` *extends* `string` = `string`

The middleware name type (string literal for type safety)

## Properties

### execute()

> **execute**: (`context`, `next`, `cancel`) => `void` \| `Promise`\<`void`\>

The middleware execution function.

#### Parameters

##### context

[`MiddlewareContext`](/docs/api/types/middleware/middlewarecontext/)

Complete context including state, helpers, and configuration

##### next

(`stateUpdate?`) => `Promise`\<[`FlowState`](/docs/api/types/model/flowstate/)\>

Call this to continue to the next middleware (optionally with state updates)

##### cancel

() => `void`

Call this to abort the entire operation

#### Returns

`void` \| `Promise`\<`void`\>

***

### name

> **name**: `TName`

Unique identifier for the middleware
