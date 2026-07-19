---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramSelectionService"
---

The `NgDiagramSelectionService` provides methods for managing the selection state of nodes and edges in the diagram.

## Example usage
```typescript
private selectionService = inject(NgDiagramSelectionService);

// Select nodes and edges
this.selectionService.select(['nodeId1'], ['edgeId1']);
```

## Extends

- `NgDiagramBaseService`

## Properties

### selection

> **selection**: `Signal`\<\{ `edges`: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]; `nodes`: [`Node`](/docs/api/types/model/node/)[]; \}\>

Returns a computed signal for the current selection of nodes and edges.

## Methods

### deleteSelection()

> **deleteSelection**(): `Promise`\<`void`\>

Deletes the current selection of nodes and edges.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).

***

### deselect()

> **deselect**(`nodeIds`, `edgeIds`): `Promise`\<`void`\>

Deselects nodes and edges by their IDs.

#### Parameters

##### nodeIds

`string`[] = `[]`

Array of node IDs to deselect.

##### edgeIds

`string`[] = `[]`

Array of edge IDs to deselect.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).

***

### deselectAll()

> **deselectAll**(): `Promise`\<`void`\>

Deselects all currently selected nodes and edges.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).

***

### select()

> **select**(`nodeIds`, `edgeIds`): `Promise`\<`void`\>

Selects nodes and edges by their IDs.

#### Parameters

##### nodeIds

`string`[] = `[]`

Array of node IDs to select.

##### edgeIds

`string`[] = `[]`

Array of edge IDs to select.

#### Returns

`Promise`\<`void`\>

A promise that resolves once the change has been applied to the model. When called inside a transaction, it resolves once the change has been queued on it (applied when the transaction commits).
