---
editUrl: false
next: false
prev: false
title: "NodeSizeDirective"
---

Directive that manages node sizing behavior in the diagram.

Handles two sizing modes:
1. **Auto-size mode** (default): Node size adapts to content with configurable defaults
2. **Explicit size mode**: Node has fixed dimensions

Size configuration priority:
1. Explicit size from node data (when autoSize=false)
2. Built-in defaults for default node types (no type specified)
3. User's CSS (for custom node types)

## Implements

- `OnDestroy`
- `OnInit`

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
