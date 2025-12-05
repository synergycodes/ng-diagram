---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "MiddlewareHistoryUpdate"
---

Records a state update made by a specific middleware.
Used to track the history of state transformations through the middleware chain.

## Example

```typescript
const middleware: Middleware = {
  name: 'audit-logger',
  execute: (context, next) => {
    // Check what previous middlewares did
    context.history.forEach(update => {
      console.log(`${update.name} modified:`, update.stateUpdate);
    });
    next();
  }
};
```

## Properties

### name

> **name**: `string`

The name of the middleware that made the update

***

### stateUpdate

> **stateUpdate**: [`FlowStateUpdate`](/docs/api/types/middleware/flowstateupdate/)

The state update that was applied
