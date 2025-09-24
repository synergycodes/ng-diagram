---
editUrl: false
next: false
prev: false
title: "NgDiagramPortComponent"
---

The `NgDiagramPortComponent` represents a single port on a node within the diagram.

## Example usage
```html
<ng-diagram-port [id]="port.id" [type]="port.type" [side]="port.side" />
```

## Extends

- `NodeContextGuardBase`

## Implements

- `OnInit`
- `OnDestroy`

## Properties

### id

> **id**: `InputSignal`\<`string`\>

The unique identifier for the port. test

***

### side

> **side**: `InputSignal`\<[`PortSide`](/docs/api/types/portside/)\>

The side of the node where the port is rendered (e.g., top, right, bottom, left).

***

### type

> **type**: `InputSignal`\<`"source"` \| `"target"` \| `"both"`\>

The type of the port (e.g., source, target, both).
