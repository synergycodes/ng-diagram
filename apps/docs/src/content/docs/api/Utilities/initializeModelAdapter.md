---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "initializeModelAdapter"
---

> **initializeModelAdapter**(`adapter`, `injector?`): [`ModelAdapter`](/docs/api/types/model/modeladapter/)

Initializes an existing model adapter for use in ng-diagram.

Strips stale runtime-computed properties and assigns fresh internal IDs
to all nodes and edges in the adapter. Use this when providing a custom
[ModelAdapter](/docs/api/types/model/modeladapter/) implementation.

## Parameters

### adapter

[`ModelAdapter`](/docs/api/types/model/modeladapter/)

An existing ModelAdapter to initialize.

### injector?

`Injector`

Optional Angular `Injector` if not running inside an injection context.

## Returns

[`ModelAdapter`](/docs/api/types/model/modeladapter/)
