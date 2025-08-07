---
editUrl: false
next: false
prev: false
title: "createMiddlewares"
---

> **createMiddlewares**\<`TMiddlewares`\>(`middlewares`): `TMiddlewares`

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* `MiddlewareChain` = \[[`Middleware`](/api/other/middleware/)\<`"z-index"`, `ZIndexMiddlewareMetadata`\>, [`Middleware`](/api/other/middleware/)\<`"group-children-change-extent"`, `GroupChildrenChangeExtentMiddlewareMetadata`\>, [`Middleware`](/api/other/middleware/)\<`"group-children-move-extent"`, `GroupChildrenMoveExtentMiddlewareMetadata`\>, [`Middleware`](/api/other/middleware/)\<`string`, `any`\>, [`Middleware`](/api/other/middleware/)\<`"edges-routing"`, `EdgesRoutingMiddlewareMetadata`\>\]

## Parameters

### middlewares

(`defaults`) => `TMiddlewares`

## Returns

`TMiddlewares`
