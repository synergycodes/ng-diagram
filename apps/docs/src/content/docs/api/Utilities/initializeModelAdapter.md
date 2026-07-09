---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "initializeModelAdapter"
---

> **initializeModelAdapter**(`adapter`, `model?`, `injector?`, `options?`): [`ModelAdapter`](/docs/api/types/model/modeladapter/)

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

### options?

[`InitializeModelOptions`](/docs/api/types/model/initializemodeloptions/)

Optional [InitializeModelOptions](/docs/api/types/model/initializemodeloptions/). ⚠️ Overriding the strip
functions can and probably will break the diagram — use at your own risk. Note
that for custom adapters these functions only affect initialization; keeping
serialization consistent in your adapter's `toJSON()` is up to you.

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

## Version History

| Version | Changes |
|---------|---------|
| v1.1.0  | Introduced |
| v1.2.5  | Added `options` parameter for customizing runtime-property stripping |
