---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "initializeModelAdapter"
---

> **initializeModelAdapter**(`adapter`, `model?`, `injector?`): [`ModelAdapter`](/docs/api/types/model/modeladapter/)

Initializes an existing model adapter for use in ng-diagram.

Prepares all nodes and edges in the adapter so they are ready for
rendering by ng-diagram. Use this when providing a custom
[ModelAdapter](/docs/api/types/model/modeladapter/) implementation.

## Parameters

### adapter

[`ModelAdapter`](/docs/api/types/model/modeladapter/)

An existing ModelAdapter to initialize.

### model?

`Partial`\<[`Model`](/docs/api/types/model/model/)\>

Optional initial model data to seed the adapter with.

### injector?

`Injector`

Optional Angular `Injector` if not running inside an injection context.

## Returns

[`ModelAdapter`](/docs/api/types/model/modeladapter/)

## Example

```typescript
// Basic usage with a custom adapter
model = initializeModelAdapter(new NgRxModelAdapter(this.store));

// With initial model data to seed the adapter
model = initializeModelAdapter(new NgRxModelAdapter(this.store), {
  nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }],
  edges: [],
});

// With an explicit injector (outside injection context)
model = initializeModelAdapter(new NgRxModelAdapter(this.store), undefined, this.injector);
```
