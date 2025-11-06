---
editUrl: false
next: false
prev: false
title: "NgDiagramGroupsService"
---

The `NgDiagramGroupsService` provides methods for managing node groups in the diagram.

## Example usage
```typescript
private groupsService = inject(NgDiagramGroupsService);

// Add nodes to a group
this.groupsService.addToGroup('groupId', ['nodeId1', 'nodeId2']);
```

## Extends

- `NgDiagramBaseService`

## Methods

### addToGroup()

> **addToGroup**(`groupId`, `nodeIds`): `void`

Adds nodes to a group.

#### Parameters

##### groupId

`string`

The ID of the group to add nodes to.

##### nodeIds

`string`[]

Array of node IDs to add to the group.

#### Returns

`void`

***

### highlightGroup()

> **highlightGroup**(`groupId`, `nodes`): `void`

Highlights a group.

#### Parameters

##### groupId

`string`

The ID of the group to highlight.

##### nodes

[`Node`](/docs/api/types/model/node/)[]

The nodes to highlight as part of the group.

#### Returns

`void`

***

### highlightGroupClear()

> **highlightGroupClear**(): `void`

Clears all group highlights.

#### Returns

`void`

***

### removeFromGroup()

> **removeFromGroup**(`groupId`, `nodeIds`): `void`

Removes nodes from a group.

#### Parameters

##### groupId

`string`

The ID of the group to remove nodes from.

##### nodeIds

`string`[]

Array of node IDs to remove from the group.

#### Returns

`void`
