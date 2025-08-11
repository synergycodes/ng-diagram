---
editUrl: false
next: false
prev: false
title: 'NgDiagramPortComponent'
---

## Extends

- `NodeContextGuardBase`

## Implements

- `OnInit`
- `OnDestroy`

## Constructors

### Constructor

> **new NgDiagramPortComponent**(): `NgDiagramPortComponent`

#### Returns

`NgDiagramPortComponent`

#### Overrides

`NodeContextGuardBase.constructor`

## Properties

### id

> **id**: `InputSignal`\<`string`\>

---

### isRenderedOnCanvas

> `readonly` **isRenderedOnCanvas**: `Signal`\<`boolean`\>

Computed signal that indicates whether the component is rendered within the node component context.
Returns true when the node component is available.

#### Inherited from

`NodeContextGuardBase.isRenderedOnCanvas`

---

### lastSide

> **lastSide**: `WritableSignal`\<`undefined` \| `PortSide`\>

---

### lastType

> **lastType**: `WritableSignal`\<`undefined` \| `"source"` \| `"target"` \| `"both"`\>

---

### nodeData

> **nodeData**: `Signal`\<`undefined` \| [`Node`](/api/types/node/)\>

---

### side

> **side**: `InputSignal`\<`PortSide`\>

---

### type

> **type**: `InputSignal`\<`"source"` \| `"target"` \| `"both"`\>

## Methods

### ngOnDestroy()

> **ngOnDestroy**(): `void`

A callback method that performs custom clean-up, invoked immediately
before a directive, pipe, or service instance is destroyed.

#### Returns

`void`

#### Implementation of

`OnDestroy.ngOnDestroy`

---

### ngOnInit()

> **ngOnInit**(): `void`

A callback method that is invoked immediately after the
default change detector has checked the directive's
data-bound properties for the first time,
and before any of the view or content children have been checked.
It is invoked only once when the directive is instantiated.

#### Returns

`void`

#### Implementation of

`OnInit.ngOnInit`
