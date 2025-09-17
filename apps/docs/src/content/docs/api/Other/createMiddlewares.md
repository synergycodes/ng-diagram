---
editUrl: false
next: false
prev: false
title: "createMiddlewares"
---

> **createMiddlewares**\<`TMiddlewares`\>(`middlewares`): `TMiddlewares`

Factory method to create a list of middlewares for ng-diagram.
Allows modifying the default middleware chain by removing, replacing, or adding new middlewares.

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* [`MiddlewareChain`](/docs/api/types/middlewarechain/) = \[[`Middleware`](/docs/api/types/middleware/)\<`"z-index"`\>, [`Middleware`](/docs/api/types/middleware/)\<`string`\>, [`Middleware`](/docs/api/types/middleware/)\<`string`\>, [`Middleware`](/docs/api/types/middleware/)\<`string`\>, [`Middleware`](/docs/api/types/middleware/)\<`string`\>, [`Middleware`](/docs/api/types/middleware/)\<`string`\>\]

The type of the resulting middleware chain

## Parameters

### middlewares

(`defaults`) => `TMiddlewares`

Function that receives default middlewares and returns modified middleware chain

## Returns

`TMiddlewares`

The modified middleware chain

Use with extreme caution - incorrectly modifying required middlewares can break the library
