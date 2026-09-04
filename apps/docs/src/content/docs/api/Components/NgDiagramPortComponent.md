---
version: "since v0.8.0"
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
- `AfterContentInit`

## Properties

### hidden

> **hidden**: `InputSignalWithTransform`\<`boolean`, `unknown`\>

Whether the port is hidden. Defaults to false.

A hidden port stays mounted as `display: none`, creates no measurement
expectation (it never blocks initialization or `waitForMeasurements`),
and is excluded as a linking target and port-snap candidate. Unhiding
re-measures it automatically.

Edges attached to a hidden port keep the port's last measured geometry
as their anchor; hide the edge itself via its `hidden` flag if it should
disappear with the port.

Accepts the static attribute form too: a bare `hidden` attribute means
hidden, matching native HTML semantics.

#### Since

1.4.0

***

### id

> **id**: `InputSignal`\<`string`\>

The unique identifier for the port.

***

### originPoint

> **originPoint**: `InputSignal`\<[`OriginPoint`](/docs/api/types/model/originpoint/)\>

The origin point for the port (e.g., topLeft, center, bottomRight).
This value determines the transform origin of the port for precise positioning.
By default, it is set to 'center'.

***

### side

> **side**: `InputSignal`\<[`Side`](/docs/api/types/model/side/)\>

The side of the node where the port is rendered (e.g., top, right, bottom, left).

***

### type

> **type**: `InputSignal`\<`"source"` \| `"target"` \| `"both"`\>

The type of the port (e.g., source, target, both).
