---
editUrl: false
next: false
prev: false
title: "LinkingInputDirective"
---

## Implements

- `OnDestroy`

## Constructors

### Constructor

> **new LinkingInputDirective**(): `LinkingInputDirective`

#### Returns

`LinkingInputDirective`

## Properties

### portId

> **portId**: `InputSignal`\<`string`\>

***

### target

> **target**: `WritableSignal`\<`undefined` \| [`Node`](/api/other/node/)\>

## Methods

### ngOnDestroy()

> **ngOnDestroy**(): `void`

A callback method that performs custom clean-up, invoked immediately
before a directive, pipe, or service instance is destroyed.

#### Returns

`void`

#### Implementation of

`OnDestroy.ngOnDestroy`

***

### onPointerDown()

> **onPointerDown**(`$event`): `void`

#### Parameters

##### $event

[`PointerInputEvent`](/api/other/pointerinputevent/)

#### Returns

`void`

***

### onPointerMove()

> **onPointerMove**(`$event`): `void`

#### Parameters

##### $event

[`PointerInputEvent`](/api/other/pointerinputevent/)

#### Returns

`void`

***

### onPointerUp()

> **onPointerUp**(`$event`): `void`

#### Parameters

##### $event

[`PointerInputEvent`](/api/other/pointerinputevent/)

#### Returns

`void`

***

### setTargetNode()

> **setTargetNode**(`node`): `void`

#### Parameters

##### node

[`Node`](/api/other/node/)

#### Returns

`void`
