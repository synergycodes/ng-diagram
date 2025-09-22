---
editUrl: false
next: false
prev: false
title: "Middleware"
---

Interface for middleware that can modify the flow state

## Type Parameters

### TName

`TName` *extends* `string` = `string`

Type of the name of the middleware (should be a string literal)

## Properties

### execute()

> **execute**: (`context`, `next`, `cancel`) => `void` \| `Promise`\<`void`\>

The function that executes the middleware logic

#### Parameters

##### context

`MiddlewareContext`

The context of the middleware

##### next

(`stateUpdate?`) => `Promise`\<`FlowState`\>

Function to call to apply the state update and continue to the next middleware

##### cancel

() => `void`

Function to call to cancel the middleware execution

#### Returns

`void` \| `Promise`\<`void`\>

***

### name

> **name**: `TName`

The name of the middleware
