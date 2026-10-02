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

Whether the port is hidden. Defaults to `false`.

A hidden port stays in the DOM with `display: none` and never blocks
initialization or `waitForMeasurements`. It cannot receive a link, and
the linking preview does not snap to it. When the port becomes visible
again, it is measured again automatically.

Edges connected to a hidden port stay visible and keep using the port's
last measured position. If the edge should disappear with the port, hide
the edge itself with its `hidden` flag.

A plain `hidden` attribute without a binding also works and means hidden,
like the native HTML attribute.

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
