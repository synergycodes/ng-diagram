---
editUrl: false
next: false
prev: false
title: "Middleware"
---

Type for middleware function that transforms state

## Template

Type of the metadata of the middleware

## Type Parameters

### TName

`TName` *extends* `string` = `string`

Type of the name of the middleware (should be a string literal)

### TMiddlewareMetadata

`TMiddlewareMetadata` = `any`

## Properties

### defaultMetadata?

> `optional` **defaultMetadata**: `TMiddlewareMetadata`

***

### execute()

> **execute**: (`context`, `next`, `cancel`) => `void` \| `Promise`\<`void`\>

#### Parameters

##### context

`MiddlewareContext`\<`MiddlewareChain`, [`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`MiddlewareChain`\>\>, `TMiddlewareMetadata`\>

##### next

(`stateUpdate?`) => `Promise`\<`FlowState`\<`TMiddlewareMetadata`\>\>

##### cancel

() => `void`

#### Returns

`void` \| `Promise`\<`void`\>

***

### name

> **name**: `TName`
