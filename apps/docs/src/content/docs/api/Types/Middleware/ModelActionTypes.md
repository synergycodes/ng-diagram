---
version: "since v0.9.0"
editUrl: false
next: false
prev: false
title: "ModelActionTypes"
---

> **ModelActionTypes** = `LooseAutocomplete`\<[`ModelActionType`](/docs/api/types/middleware/modelactiontype/)\>[]

Array of model action types, used to track all actions in a transaction or a single action.
Supports both known action types with autocomplete and custom string action types.

## Example

```typescript
const middleware: Middleware = {
  name: 'logger',
  execute: (context, next) => {
    console.log('Action types:', context.modelActionTypes.join(', '));
    next();
  }
};
```
