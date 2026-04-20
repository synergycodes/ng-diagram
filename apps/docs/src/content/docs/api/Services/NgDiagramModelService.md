---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramModelService"
---

The `NgDiagramModelService` provides methods for accessing and manipulating the diagram's model.

## Example usage
```typescript
private modelService = inject(NgDiagramModelService);

// Add nodes
this.modelService.addNodes([node1, node2]);
```

## Extends

- `NgDiagramBaseService`

## Implements

- `OnDestroy`

## Properties

### edges

> `readonly` **edges**: `Signal`\<[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]\>

Readonly signal of current edges in the diagram.

***

### metadata

> `readonly` **metadata**: `Signal`\<[`Metadata`](/docs/api/types/model/metadata/)\<`object`\>\>

Readonly signal of current diagram metadata.

***

### nodes

> `readonly` **nodes**: `Signal`\<[`Node`](/docs/api/types/model/node/)[]\>

Readonly signal of current nodes in the diagram.

## Methods

### addEdges()

> **addEdges**(`edges`): `void`

Adds new edges to the diagram.

#### Parameters

##### edges

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Array of edges to add.

#### Returns

`void`

***

### addNodes()

> **addNodes**(`nodes`): `void`

Adds new nodes to the diagram.

#### Parameters

##### nodes

[`Node`](/docs/api/types/model/node/)[]

Array of nodes to add.

#### Returns

`void`

***

### computePartsBounds()

> **computePartsBounds**(`nodes`, `edges`): [`Rect`](/docs/api/types/geometry/rect/)

#### Parameters

##### nodes

[`Node`](/docs/api/types/model/node/)[]

Array of nodes

##### edges

[`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Array of edges

#### Returns

[`Rect`](/docs/api/types/geometry/rect/)

Bounding rectangle containing all nodes and edges

#### Since

0.9.0

Computes the axis-aligned bounding rectangle that contains all specified nodes and edges.

***

### deleteEdges()

> **deleteEdges**(`ids`): `void`

Deletes edges by their IDs.

#### Parameters

##### ids

`string`[]

Array of edge IDs to delete.

#### Returns

`void`

***

### deleteNodes()

> **deleteNodes**(`ids`): `void`

Deletes nodes by their IDs.

#### Parameters

##### ids

`string`[]

Array of node IDs to delete.

#### Returns

`void`

***

### getChildren()

> **getChildren**\<`T`\>(`groupId`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

Gets all children nodes for a given group node id

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

#### Parameters

##### groupId

`string`

group node id

#### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

Array of child nodes

***

### getChildrenNested()

> **getChildrenNested**\<`T`\>(`groupId`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

Gets all nested children (descendants) of a group node

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

#### Parameters

##### groupId

`string`

Group node id

#### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

Array of all descendant nodes (children, grandchildren, etc.)

***

### getConnectedEdges()

> **getConnectedEdges**\<`T`\>(`nodeId`): [`Edge`](/docs/api/types/model/edge/)\<`T`\>[]

Gets all edges connected to a node

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the edges' `data` property. Defaults to `DataObject`.

#### Parameters

##### nodeId

`string`

Node id

#### Returns

[`Edge`](/docs/api/types/model/edge/)\<`T`\>[]

Array of edges where the node is either source or target

***

### getConnectedNodes()

> **getConnectedNodes**\<`T`\>(`nodeId`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

Gets all nodes connected to a node via edges

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

#### Parameters

##### nodeId

`string`

Node id

#### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

Array of nodes connected to the given node

***

### getEdgeById()

> **getEdgeById**\<`T`\>(`edgeId`): `null` \| [`Edge`](/docs/api/types/model/edge/)\<`T`\>

Gets an edge by id.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the edge's `data` property. Defaults to `DataObject`.

#### Parameters

##### edgeId

`string`

Edge id.

#### Returns

`null` \| [`Edge`](/docs/api/types/model/edge/)\<`T`\>

Edge or null if not found.

***

### getModel()

> **getModel**(): [`ModelAdapter`](/docs/api/types/model/modeladapter/)

Returns the current model that NgDiagram instance is using.
Returns null if flowCore is not initialized.

#### Returns

[`ModelAdapter`](/docs/api/types/model/modeladapter/)

***

### getNearestNodeInRange()

> **getNearestNodeInRange**\<`T`\>(`point`, `range`): `null` \| [`Node`](/docs/api/types/model/node/)\<`T`\>

Gets the nearest node in a range from a point.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the node's `data` property. Defaults to `DataObject`.

#### Parameters

##### point

[`Point`](/docs/api/types/geometry/point/)

Point to check from.

##### range

`number`

Range to check in.

#### Returns

`null` \| [`Node`](/docs/api/types/model/node/)\<`T`\>

Nearest node in range or null.

***

### getNearestPortInRange()

> **getNearestPortInRange**(`point`, `range`): `null` \| [`Port`](/docs/api/types/model/port/)

Gets the nearest port in a range from a point.

#### Parameters

##### point

[`Point`](/docs/api/types/geometry/point/)

Point to check from.

##### range

`number`

Range to check in.

#### Returns

`null` \| [`Port`](/docs/api/types/model/port/)

Nearest port in range or null.

***

### getNodeById()

> **getNodeById**\<`T`\>(`nodeId`): `null` \| [`Node`](/docs/api/types/model/node/)\<`T`\>

Gets a node by id.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the node's `data` property. Defaults to `DataObject`.

#### Parameters

##### nodeId

`string`

Node id.

#### Returns

`null` \| [`Node`](/docs/api/types/model/node/)\<`T`\>

Node or null if not found.

***

### getNodeEnds()

> **getNodeEnds**\<`S`, `T`\>(`edgeId`): `null` \| \{ `source`: [`Node`](/docs/api/types/model/node/)\<`S`\>; `target`: [`Node`](/docs/api/types/model/node/)\<`T`\>; \}

Gets the source and target nodes of an edge

#### Type Parameters

##### S

`S` *extends* `object` = `object`

The type of the source node's `data` property. Defaults to `DataObject`.

##### T

`T` *extends* `object` = `object`

The type of the target node's `data` property. Defaults to `DataObject`.

#### Parameters

##### edgeId

`string`

Edge id

#### Returns

`null` \| \{ `source`: [`Node`](/docs/api/types/model/node/)\<`S`\>; `target`: [`Node`](/docs/api/types/model/node/)\<`T`\>; \}

Object containing source and target nodes, or null if edge doesn't exist

***

### getNodesInRange()

> **getNodesInRange**\<`T`\>(`point`, `range`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

Gets all nodes in a range from a point.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

#### Parameters

##### point

[`Point`](/docs/api/types/geometry/point/)

Point to check from.

##### range

`number`

Range to check in.

#### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

Array of nodes in range.

***

### getOverlappingNodes()

#### Call Signature

> **getOverlappingNodes**\<`T`\>(`nodeId`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

Detects collision with other nodes by finding all nodes whose rectangles intersect
with the specified node's bounding rectangle.

##### Type Parameters

###### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

##### Parameters

###### nodeId

`string`

The ID of the node to check for collisions

##### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

An array of Nodes that overlap with the specified node

#### Call Signature

> **getOverlappingNodes**\<`T`\>(`node`): [`Node`](/docs/api/types/model/node/)\<`T`\>[]

##### Type Parameters

###### T

`T` *extends* `object` = `object`

The type of the nodes' `data` property. Defaults to `DataObject`.

##### Parameters

###### node

[`Node`](/docs/api/types/model/node/)\<`T`\>

The node to check for collisions

##### Returns

[`Node`](/docs/api/types/model/node/)\<`T`\>[]

An array of Nodes that overlap with the specified node

##### Since

0.9.0

Detects collision with other nodes by finding all nodes whose rectangles intersect
with the specified node's bounding rectangle.

***

### getParentHierarchy()

> **getParentHierarchy**\<`T`\>(`nodeId`): [`GroupNode`](/docs/api/types/model/groupnode/)\<`T`\>[]

Gets the full chain of parent group Nodes for a given nodeId.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the group nodes' `data` property. Defaults to `DataObject`.

#### Parameters

##### nodeId

`string`

Node id

#### Returns

[`GroupNode`](/docs/api/types/model/groupnode/)\<`T`\>[]

Array of parent group Node objects, from closest parent to farthest ancestor

***

### isNestedChild()

> **isNestedChild**(`nodeId`, `groupId`): `boolean`

Checks if a node is a nested child (descendant) of a group node

#### Parameters

##### nodeId

`string`

Node id

##### groupId

`string`

Group node id

#### Returns

`boolean`

True if the node is part of the group's nested subgraph

***

### toJSON()

> **toJSON**(): `string`

Serializes the current model to a JSON string.

#### Returns

`string`

The model as a JSON string.

***

### updateEdge()

> **updateEdge**(`edgeId`, `edge`): `void`

Updates the properties of an edge.

#### Parameters

##### edgeId

`string`

Edge id.

##### edge

`Partial`\<[`Edge`](/docs/api/types/model/edge/)\>

New edge properties.

#### Returns

`void`

***

### updateEdgeData()

> **updateEdgeData**\<`T`\>(`edgeId`, `data`): `void`

Updates the data of an edge.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the edge's `data` property. Defaults to `DataObject`.

#### Parameters

##### edgeId

`string`

Edge id.

##### data

`T`

New data to set for the edge.

#### Returns

`void`

***

### updateEdges()

> **updateEdges**(`edges`): `void`

Updates multiple edges at once.

#### Parameters

##### edges

`Pick`\<[`Edge`](/docs/api/types/model/edge/)\<`object`\>, `"id"`\> & `Partial`\<[`Edge`](/docs/api/types/model/edge/)\<`object`\>\>[]

Array of edge updates (must include id and any properties to update).

#### Returns

`void`

***

### updateNode()

> **updateNode**(`nodeId`, `node`): `void`

Updates the properties of a node.

#### Parameters

##### nodeId

`string`

Node id.

##### node

`Partial`\<[`Node`](/docs/api/types/model/node/)\>

New node properties.

#### Returns

`void`

***

### updateNodeData()

> **updateNodeData**\<`T`\>(`nodeId`, `data`): `void`

Updates the data of a node.

#### Type Parameters

##### T

`T` *extends* `object` = `object`

The type of the node's `data` property. Defaults to `DataObject`.

#### Parameters

##### nodeId

`string`

Node id.

##### data

`T`

New data to set for the node.

#### Returns

`void`

***

### updateNodes()

> **updateNodes**(`nodes`): `void`

Updates multiple nodes at once.

#### Parameters

##### nodes

`Pick`\<[`Node`](/docs/api/types/model/node/), `"id"`\> & `Partial`\<[`Node`](/docs/api/types/model/node/)\>[]

Array of node updates (must include id and any properties to update).

#### Returns

`void`
