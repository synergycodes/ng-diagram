---
editUrl: false
next: false
prev: false
title: "initializeModel"
---

> **initializeModel**\<`TMiddlewares`\>(`model`, `injector?`): `SignalModelAdapter`\<`TMiddlewares`\>

Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* [`MiddlewareChain`](/api/other/middlewarechain/) = \[\]

## Parameters

### model

`Partial`\<`Model`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\>\> = `{}`

### injector?

`Injector`

## Returns

`SignalModelAdapter`\<`TMiddlewares`\>
