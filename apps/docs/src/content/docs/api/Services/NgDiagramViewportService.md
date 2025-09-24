---
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

> **viewport**: `Signal`\<[`Viewport`](/docs/api/types/viewport/)\>

Returns a computed signal for the viewport that safely handles uninitialized state.

## Methods

### clientToFlowPosition()

> **clientToFlowPosition**(`clientPosition`): [`Point`](/docs/api/types/point/)

Converts a client position to a flow position.

#### Parameters

##### clientPosition

[`Point`](/docs/api/types/point/)

Client position to convert.

#### Returns

[`Point`](/docs/api/types/point/)

Flow position.

***

### clientToFlowViewportPosition()

> **clientToFlowViewportPosition**(`clientPosition`): [`Point`](/docs/api/types/point/)

Converts a client position to a position relative to the flow viewport.

#### Parameters

##### clientPosition

[`Point`](/docs/api/types/point/)

Client position.

#### Returns

[`Point`](/docs/api/types/point/)

Position on the flow viewport.

***

### flowToClientPosition()

> **flowToClientPosition**(`flowPosition`): [`Point`](/docs/api/types/point/)

Converts a flow position to a client position.

#### Parameters

##### flowPosition

[`Point`](/docs/api/types/point/)

Flow position to convert.

#### Returns

[`Point`](/docs/api/types/point/)

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

[`Point`](/docs/api/types/point/)

The center point to zoom towards.

#### Returns

`void`
