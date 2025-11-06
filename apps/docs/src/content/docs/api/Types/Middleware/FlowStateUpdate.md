---
editUrl: false
next: false
prev: false
title: "FlowStateUpdate"
---

Describes a set of changes to apply to the diagram state.
Middlewares can modify state by passing a FlowStateUpdate to the `next()` function.

## Example

```typescript
const middleware: Middleware = {
  name: 'auto-arranger',
  execute: (context, next) => {
    // Apply state changes
    next({
      nodesToUpdate: [
        { id: 'node1', position: { x: 100, y: 200 } },
        { id: 'node2', position: { x: 300, y: 200 } }
      ],
      metadataUpdate: {
        viewport: { x: 0, y: 0, zoom: 1 }
      }
    });
  }
};
```

## Properties

### edgesToAdd?

> `optional` **edgesToAdd**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Edges to add to the diagram

***

### edgesToRemove?

> `optional` **edgesToRemove**: `string`[]

IDs of edges to remove from the diagram

***

### edgesToUpdate?

> `optional` **edgesToUpdate**: `Partial`\<[`Edge`](/docs/api/types/model/edge/)\<`object`\>\> & `object`[]

Partial edge updates (only changed properties need to be specified)

***

### metadataUpdate?

> `optional` **metadataUpdate**: `Partial`\<[`Metadata`](/docs/api/types/model/metadata/)\<`object`\>\>

Partial metadata update (viewport, selection, etc.)

***

### nodesToAdd?

> `optional` **nodesToAdd**: [`Node`](/docs/api/types/model/node/)[]

Nodes to add to the diagram

***

### nodesToRemove?

> `optional` **nodesToRemove**: `string`[]

IDs of nodes to remove from the diagram

***

### nodesToUpdate?

> `optional` **nodesToUpdate**: `Partial`\<[`Node`](/docs/api/types/model/node/)\> & `object`[]

Partial node updates (only changed properties need to be specified)
