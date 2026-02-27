---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "initializeModel"
---

> **initializeModel**(`model`, `injector?`): [`ModelAdapter`](/docs/api/types/model/modeladapter/)

Creates a model adapter with initial nodes, edges, and metadata.

This helper sets up a model instance ready for use in ng-diagram.
It must be run in an Angular injection context unless the `injector` option is provided manually.

⚠️ This is only for creating the initial model. Any changes to the model or
access to current data should be done via [NgDiagramModelService](/docs/api/services/ngdiagrammodelservice/).

## Parameters

### model

`Partial`\<[`Model`](/docs/api/types/model/model/)\> = `{}`

Initial model data (nodes, edges, metadata).

### injector?

`Injector`

Optional Angular `Injector` if not running inside an injection context.

## Returns

[`ModelAdapter`](/docs/api/types/model/modeladapter/)

## Example

```typescript
// Create an empty model
model = initializeModel();

// Create a model with initial data
model = initializeModel({
  nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }],
  edges: [],
});

// With an explicit injector (outside injection context)
model = initializeModel({ nodes: [...], edges: [...] }, this.injector);
```
