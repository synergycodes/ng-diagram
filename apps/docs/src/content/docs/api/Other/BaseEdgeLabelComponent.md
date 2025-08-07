---
editUrl: false
next: false
prev: false
title: "BaseEdgeLabelComponent"
---

## Implements

- `OnInit`
- `OnDestroy`

## Constructors

### Constructor

> **new BaseEdgeLabelComponent**(): `BaseEdgeLabelComponent`

#### Returns

`BaseEdgeLabelComponent`

## Properties

### edgeData

> **edgeData**: `Signal`\<[`Edge`](/api/other/edge/)\>

***

### edgeId

> **edgeId**: `Signal`\<`string`\>

***

### id

> **id**: `InputSignal`\<`string`\>

***

### points

> **points**: `Signal`\<`undefined` \| [`Point`](/api/types/point/)[]\>

***

### position

> **position**: `Signal`\<[`Point`](/api/types/point/)\>

***

### positionOnEdge

> **positionOnEdge**: `InputSignal`\<`number`\>

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
