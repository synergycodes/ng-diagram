---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramViewportService"
---

The `NgDiagramViewportService` provides methods and signals for interacting with the diagram viewport.

## Example usage
```typescript
private viewportService = inject(NgDiagramViewportService);

// Move viewport to (100, 200)
this.viewportService.moveViewport(100, 200);

// Zoom in by a factor of 1.2
this.viewportService.zoom(1.2);
```

## Extends

- `NgDiagramBaseService`

## Properties

### scale

> **scale**: `Signal`\<`number`\>

Returns a computed signal for the scale that safely handles uninitialized state.

***

### viewport

> **viewport**: `Signal`\<[`Viewport`](/docs/api/types/model/viewport/)\>

Returns a computed signal for the viewport that safely handles uninitialized state.

## Methods

### centerOnNode()

> **centerOnNode**(`nodeOrId`): `void`

Centers the Node within the current viewport bounds.

#### Parameters

##### nodeOrId

The ID of the node or the node object to center on.

`string` | [`Node`](/docs/api/types/model/node/)

#### Returns

`void`

#### Remarks

When calling `centerOnNode()` immediately after adding or modifying a node, its dimensions may not be measured yet.
Use the `waitForMeasurements` transaction option to ensure accurate centering:
```typescript
await this.ngDiagramService.transaction(() => {
  this.modelService.addNodes([newNode]);
}, { waitForMeasurements: true });
this.viewportService.centerOnNode(newNode.id); // Now centers correctly
```

***

### centerOnRect()

> **centerOnRect**(`rect`): `void`

Centers the rectangle within the current viewport bounds.

#### Parameters

##### rect

[`Rect`](/docs/api/types/geometry/rect/)

The rectangle to center on.

#### Returns

`void`

***

### clientToFlowPosition()

> **clientToFlowPosition**(`clientPosition`): [`Point`](/docs/api/types/geometry/point/)

Converts a client position to a flow position.

#### Parameters

##### clientPosition

[`Point`](/docs/api/types/geometry/point/)

Client position to convert.

#### Returns

[`Point`](/docs/api/types/geometry/point/)

Flow position.

***

### clientToFlowViewportPosition()

> **clientToFlowViewportPosition**(`clientPosition`): [`Point`](/docs/api/types/geometry/point/)

Converts a client position to a position relative to the flow viewport.

#### Parameters

##### clientPosition

[`Point`](/docs/api/types/geometry/point/)

Client position.

#### Returns

[`Point`](/docs/api/types/geometry/point/)

Position on the flow viewport.

***

### flowToClientPosition()

> **flowToClientPosition**(`flowPosition`): [`Point`](/docs/api/types/geometry/point/)

Converts a flow position to a client position.

#### Parameters

##### flowPosition

[`Point`](/docs/api/types/geometry/point/)

Flow position to convert.

#### Returns

[`Point`](/docs/api/types/geometry/point/)

Client position.

***

### moveViewport()

> **moveViewport**(`x`, `y`): `void`

Moves the viewport to the specified coordinates.

#### Parameters

##### x

`number`

The x-coordinate to move the viewport to.

##### y

`number`

The y-coordinate to move the viewport to.

#### Returns

`void`

***

### moveViewportBy()

> **moveViewportBy**(`dx`, `dy`): `void`

Moves the viewport by the specified amounts.

#### Parameters

##### dx

`number`

The amount to move the viewport in the x-direction.

##### dy

`number`

The amount to move the viewport in the y-direction.

#### Returns

`void`

***

### zoom()

> **zoom**(`factor`, `center?`): `void`

Zooms the viewport by the specified factor.

#### Parameters

##### factor

`number`

The factor to zoom by.

##### center?

[`Point`](/docs/api/types/geometry/point/)

The center point to zoom towards.

#### Returns

`void`

***

### zoomToFit()

> **zoomToFit**(`options?`): `void`

Automatically adjusts the viewport to fit all diagram content (or a specified subset) within the visible area.

#### Parameters

##### options?

Optional configuration object

###### edgeIds?

`string`[]

Array of edge IDs to fit. If not provided, all edges are included.

###### nodeIds?

`string`[]

Array of node IDs to fit. If not provided, all nodes are included.

###### padding?

`number` \| \[`number`, `number`\] \| \[`number`, `number`, `number`\] \| \[`number`, `number`, `number`, `number`\]

Padding around the content (default: 50). Supports CSS-like syntax:
  - Single number: uniform padding on all sides
  - [top/bottom, left/right]: vertical and horizontal padding
  - [top, left/right, bottom]: top, horizontal, bottom padding
  - [top, right, bottom, left]: individual padding for each side

#### Returns

`void`

#### Remarks

When calling `zoomToFit()` immediately after adding or modifying nodes/edges, their dimensions may not be measured yet.
Use the `waitForMeasurements` transaction option to ensure accurate results:
```typescript
await this.ngDiagramService.transaction(() => {
  this.modelService.addNodes([newNode]);
}, { waitForMeasurements: true });
this.viewportService.zoomToFit(); // Now includes new node dimensions
```

#### Example

```typescript
// Fit all nodes and edges with default padding
this.viewportService.zoomToFit();

// Fit with custom uniform padding
this.viewportService.zoomToFit({ padding: 100 });

// Fit with different padding on each side [top, right, bottom, left]
this.viewportService.zoomToFit({ padding: [50, 100, 50, 100] });

// Fit only specific nodes
this.viewportService.zoomToFit({ nodeIds: ['node1', 'node2'] });
```
