---
editUrl: false
next: false
prev: false
title: "NgDiagramNodeRotateAdornmentComponent"
---

## Extends

- `NodeContextGuardBase`

## Constructors

### Constructor

> **new NgDiagramNodeRotateAdornmentComponent**(): `NgDiagramNodeRotateAdornmentComponent`

#### Returns

`NgDiagramNodeRotateAdornmentComponent`

#### Inherited from

`NodeContextGuardBase.constructor`

## Properties

### eventTarget

> `readonly` **eventTarget**: `Signal`\<\{ `element`: `undefined` \| [`Node`](/api/other/node/); `type`: `"rotate-handle"`; \}\>

***

### isRenderedOnCanvas

> `readonly` **isRenderedOnCanvas**: `Signal`\<`boolean`\>

Computed signal that indicates whether the component is rendered within the node component context.
Returns true when the node component is available.

#### Inherited from

`NodeContextGuardBase.isRenderedOnCanvas`

***

### isRotating

> `readonly` **isRotating**: `WritableSignal`\<`boolean`\>

***

### nodeData

> `readonly` **nodeData**: `Signal`\<`undefined` \| [`Node`](/api/other/node/)\>

***

### showAdornment

> `readonly` **showAdornment**: `Signal`\<`undefined` \| `boolean`\>
