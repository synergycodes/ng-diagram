---
editUrl: false
next: false
prev: false
title: "NodeSizeDirective"
---

## Implements

- `OnDestroy`
- `OnInit`

## Constructors

### Constructor

> **new NodeSizeDirective**(): `NodeSizeDirective`

#### Returns

`NodeSizeDirective`

## Properties

### autoSize

> **autoSize**: `Signal`\<`boolean`\>

***

### data

> **data**: `InputSignal`\<[`Node`](/api/other/node/)\>

***

### id

> **id**: `Signal`\<`string`\>

***

### size

> **size**: `Signal`\<`undefined` \| `Size`\>

***

### sizeState

> **sizeState**: `Signal`\<\{ `autoSize`: `boolean`; `size`: `undefined` \| `Size`; \}\>

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
