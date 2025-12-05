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

> **deleteSelection**(): `void`

Deletes the current selection of nodes and edges.

#### Returns

`void`

***

### deselect()

> **deselect**(`nodeIds`, `edgeIds`): `void`

Deselects nodes and edges by their IDs.

#### Parameters

##### nodeIds

`string`[] = `[]`

Array of node IDs to deselect.

##### edgeIds

`string`[] = `[]`

Array of edge IDs to deselect.

#### Returns

`void`

***

### deselectAll()

> **deselectAll**(): `void`

Deselects all currently selected nodes and edges.

#### Returns

`void`

***

### select()

> **select**(`nodeIds`, `edgeIds`): `void`

Selects nodes and edges by their IDs.

#### Parameters

##### nodeIds

`string`[] = `[]`

Array of node IDs to select.

##### edgeIds

`string`[] = `[]`

Array of edge IDs to select.

#### Returns

`void`
