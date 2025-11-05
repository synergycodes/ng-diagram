---
editUrl: false
next: false
prev: false
title: "EdgeRoutingManager"
---

**Internal manager** for registration, selection, and execution of edge routing implementations.

## Remarks

**For application code, use [NgDiagramService](/docs/api/services/ngdiagramservice/) routing methods instead.**
This class is exposed primarily for middleware development where you can access it
via `context.edgeRoutingManager`.

The manager comes pre-populated with built-in routings (`orthogonal`, `bezier`, `polyline`).
You can register custom routings at runtime.

## Example

```typescript
const middleware: Middleware = {
  name: 'routing-optimizer',
  execute: (context, next) => {
    const routingManager = context.edgeRoutingManager;
    const defaultRouting = routingManager.getDefaultRouting();
    console.log('Using routing:', defaultRouting);
    next();
  }
};
```

## Methods

### computePath()

> **computePath**(`routingName`, `points`): `string`

Computes an SVG path string for the given points using the specified routing.

#### Parameters

##### routingName

The routing to use. If omitted or undefined, the default routing is used.

`undefined` | [`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

##### points

[`Point`](/docs/api/types/point/)[]

The points to convert into an SVG path string

#### Returns

`string`

An SVG path string suitable for the `d` attribute of an SVG `<path>` element

#### Throws

Will throw if the resolved routing is not registered

#### Example

```typescript
const points = [{ x: 0, y: 0 }, { x: 100, y: 100 }, { x: 200, y: 100 }];
const path = routingManager.computePath('polyline', points);
// Returns: "M 0 0 L 100 100 L 200 100"
```

***

### computePointOnPath()

> **computePointOnPath**(`routingName`, `points`, `percentage`): [`Point`](/docs/api/types/point/)

Computes a point along the path at a given percentage.

#### Parameters

##### routingName

The routing to use. If omitted or undefined, the default routing is used.

`undefined` | [`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

##### points

[`Point`](/docs/api/types/point/)[]

The path points

##### percentage

`number`

Position along the path in range [0, 1] where 0 = start, 1 = end

#### Returns

[`Point`](/docs/api/types/point/)

The interpolated point on the path

#### Remarks

If the selected routing implements `computePointOnPath`, it will be used.
Otherwise, falls back to linear interpolation between the first and last points.

#### Throws

Will throw if the resolved routing is not registered

#### Example

```typescript
const points = [{ x: 0, y: 0 }, { x: 100, y: 100 }];
const midpoint = routingManager.computePointOnPath('polyline', points, 0.5);
// Returns: { x: 50, y: 50 }
const quarterPoint = routingManager.computePointOnPath('polyline', points, 0.25);
// Returns: { x: 25, y: 25 }
```

***

### computePoints()

> **computePoints**(`routingName`, `context`): [`Point`](/docs/api/types/point/)[]

Computes the routed points for an edge using the specified routing algorithm.

#### Parameters

##### routingName

The routing to use. If omitted or undefined, the default routing is used.

`undefined` | [`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

##### context

[`EdgeRoutingContext`](/docs/api/types/edgeroutingcontext/)

The routing context containing source/target nodes, ports, edge data, etc.

#### Returns

[`Point`](/docs/api/types/point/)[]

The computed polyline as an array of points

#### Throws

Will throw if the resolved routing is not registered

#### Example

```typescript
const points = routingManager.computePoints('orthogonal', {
  sourceNode: node1,
  targetNode: node2,
  sourcePosition: { x: 100, y: 50 },
  targetPosition: { x: 300, y: 200 },
  edge: edge
});
```

***

### getDefaultRouting()

> **getDefaultRouting**(): [`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

Gets the current default routing name.

#### Returns

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

The name of the current default routing

***

### getRegisteredRoutings()

> **getRegisteredRoutings**(): [`EdgeRoutingName`](/docs/api/types/edgeroutingname/)[]

Gets all registered routing names.

#### Returns

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)[]

An array of registered routing names (built-in and custom)

***

### getRouting()

> **getRouting**(`name`): `undefined` \| [`EdgeRouting`](/docs/api/other/edgerouting/)

Gets a routing implementation by name.

#### Parameters

##### name

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

The routing name to look up

#### Returns

`undefined` \| [`EdgeRouting`](/docs/api/other/edgerouting/)

The routing implementation or `undefined` if not registered

***

### hasRouting()

> **hasRouting**(`name`): `boolean`

Checks whether a routing is registered.

#### Parameters

##### name

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

The routing name to check

#### Returns

`boolean`

`true` if registered; otherwise `false`

***

### registerRouting()

> **registerRouting**(`routing`): `void`

Registers (or replaces) a routing implementation.

#### Parameters

##### routing

[`EdgeRouting`](/docs/api/other/edgerouting/)

The routing instance to register. Its name must be non-empty.

#### Returns

`void`

#### Throws

Will throw if `routing.name` is falsy.

***

### setDefaultRouting()

> **setDefaultRouting**(`name`): `void`

Sets the default routing to use for all edges when no specific routing is specified.

#### Parameters

##### name

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

The routing name to set as default

#### Returns

`void`

#### Throws

Will throw if the routing is not registered

***

### unregisterRouting()

> **unregisterRouting**(`name`): `void`

Unregisters a routing by name.

#### Parameters

##### name

[`EdgeRoutingName`](/docs/api/types/edgeroutingname/)

The routing name to remove

#### Returns

`void`
