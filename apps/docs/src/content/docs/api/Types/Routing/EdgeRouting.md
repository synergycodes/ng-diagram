---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "EdgeRouting"
---

Interface for routing implementations

## Properties

### name

> **name**: `string`

Name identifier for the routing.

## Methods

### computePointAtDistance()?

> `optional` **computePointAtDistance**(`points`, `distancePx`): [`Point`](/docs/api/types/geometry/point/)

Gets a point on the path at a given pixel distance from the start.
Negative values measure from the end of the path.

#### Parameters

##### points

[`Point`](/docs/api/types/geometry/point/)[]

The points defining the path.

##### distancePx

`number`

Distance in pixels (positive = from start, negative = from end).

#### Returns

[`Point`](/docs/api/types/geometry/point/)

The point at the given distance along the path.

***

### computePointOnPath()?

> `optional` **computePointOnPath**(`points`, `percentage`): [`Point`](/docs/api/types/geometry/point/)

Gets a point on the path at a given percentage (0-1).
Useful for positioning labels, decorations, or interaction handles.

#### Parameters

##### points

[`Point`](/docs/api/types/geometry/point/)[]

The points defining the path.

##### percentage

`number`

Position along the path (0 = start, 1 = end).

#### Returns

[`Point`](/docs/api/types/geometry/point/)

The point at the given percentage along the path.

***

### computePoints()

> **computePoints**(`context`, `config?`): [`Point`](/docs/api/types/geometry/point/)[]

Computes the points for the edge path.
This is the core routing logic that determines
how an edge is drawn between source and target.

#### Parameters

##### context

[`EdgeRoutingContext`](/docs/api/types/routing/edgeroutingcontext/)

The routing context containing source/target info and layout state.

##### config?

[`EdgeRoutingConfig`](/docs/api/types/configuration/features/edgeroutingconfig/)

Optional configuration parameters for routing behavior.

#### Returns

[`Point`](/docs/api/types/geometry/point/)[]

An array of points representing the routed edge path.

***

### computeSvgPath()

> **computeSvgPath**(`points`, `config?`): `string`

Generates an SVG path string from points.
Converts the routed points into a valid `d` attribute
for an `<path>` SVG element.

#### Parameters

##### points

[`Point`](/docs/api/types/geometry/point/)[]

The points defining the edge path.

##### config?

[`EdgeRoutingConfig`](/docs/api/types/configuration/features/edgeroutingconfig/)

Optional configuration parameters for path generation.

#### Returns

`string`

An SVG path string.
