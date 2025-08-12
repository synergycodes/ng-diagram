---
editUrl: false
next: false
prev: false
title: "createSignalModel"
---

> **createSignalModel**\<`TMiddlewares`\>(`model`, `injector?`): `SignalModelAdapter`\<`TMiddlewares`\>

Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.

## Type Parameters

### TMiddlewares

`TMiddlewares` *extends* `MiddlewareChain` = \[\]

## Parameters

### model

`Partial`\<`Model`\<[`Metadata`](/api/other/metadata/)\<`MiddlewaresConfigFromMiddlewares`\<`TMiddlewares`\>\>\>\> = `{}`

### injector?

`Injector`

## Returns

`SignalModelAdapter`\<`TMiddlewares`\>
