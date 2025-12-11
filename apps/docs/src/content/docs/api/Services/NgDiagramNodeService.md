---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramNodeService"
---

The `NgDiagramNodeService` provides methods for manipulating nodes in the diagram.

## Example usage
```typescript
private nodeService = inject(NgDiagramNodeService);

// Move nodes by a delta
this.nodeService.moveNodesBy([node1, node2], { x: 10, y: 20 });
```

## Extends

- `NgDiagramBaseService`

## Methods

### bringToFront()

> **bringToFront**(`nodeIds?`, `edgeIds?`): `void`

Brings the specified nodes and edges to the front (highest z-index).

#### Parameters

##### nodeIds?

`string`[]

Array of node IDs to bring to front.

##### edgeIds?

`string`[]

Array of edge IDs to bring to front.

#### Returns

`void`

***

### moveNodesBy()

> **moveNodesBy**(`nodes`, `delta`): `void`

Moves nodes by the specified amounts.

#### Parameters

##### nodes

[`Node`](/docs/api/types/model/node/)[]

Array of nodes to move.

##### delta

[`Point`](/docs/api/types/geometry/point/)

The amount to move the nodes by.

#### Returns

`void`

***

### resizeNode()

> **resizeNode**(`id`, `size`, `position?`, `disableAutoSize?`): `void`

Resizes a node to the specified dimensions.
`Node.autoSize` must be set to false to resize a node.

#### Parameters

##### id

`string`

The ID of the node to resize.

##### size

[`Size`](/docs/api/types/geometry/size/)

The new size of the node.

##### position?

[`Point`](/docs/api/types/geometry/point/)

Optional new position of the node.

##### disableAutoSize?

`boolean`

Optional flag to disable auto-sizing.

#### Returns

`void`

***

### rotateNodeTo()

> **rotateNodeTo**(`nodeId`, `angle`): `void`

Rotates a node to the specified angle.

#### Parameters

##### nodeId

`string`

The ID of the node to rotate.

##### angle

`number`

The rotation angle in degrees.

#### Returns

`void`

***

### sendToBack()

> **sendToBack**(`nodeIds?`, `edgeIds?`): `void`

Sends the specified nodes and edges to the back (lowest z-index).

#### Parameters

##### nodeIds?

`string`[]

Array of node IDs to send to back.

##### edgeIds?

`string`[]

Array of edge IDs to send to back.

#### Returns

`void`
