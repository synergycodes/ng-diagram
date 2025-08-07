---
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

To create an edge with a custom path, you must provide the `pathAndPoints` property.
If you want to use one of the default edge types, set the `routing` property in `edge`
or provide the `routing` property as a component prop

- For custom paths:
 - Provide the `pathAndPoints` prop to the component with your custom `path` string and `points` array.

- For default paths:
  - Set `routing` in `edge` to one of the supported types (e.g., `'straight'`, `'bezier'`, `'orthogonal'`).
  - Or provide the `routing` property as a component prop
  - The edge will automatically generate its path based on the routing type and provided points.

## Constructors

### Constructor

> **new NgDiagramBaseEdgeComponent**(): `NgDiagramBaseEdgeComponent`

#### Returns

`NgDiagramBaseEdgeComponent`

## Properties

### customMarkerEnd

> **customMarkerEnd**: `InputSignal`\<`undefined` \| `string`\>

***

### customMarkerStart

> **customMarkerStart**: `InputSignal`\<`undefined` \| `string`\>

***

### data

> **data**: `InputSignal`\<[`Edge`](/api/other/edge/)\>

***

### labels

> **labels**: `Signal`\<`EdgeLabel`[]\>

***

### markerEnd

> **markerEnd**: `Signal`\<`null` \| `string`\>

***

### markerStart

> **markerStart**: `Signal`\<`null` \| `string`\>

***

### path

> **path**: `Signal`\<`string`\>

***

### pathAndPoints

> **pathAndPoints**: `InputSignal`\<`undefined` \| \{ `path`: `string`; `points`: [`Point`](/api/types/point/)[]; \}\>

***

### points

> **points**: `Signal`\<`undefined` \| [`Point`](/api/types/point/)[]\>

***

### routing

> **routing**: `InputSignal`\<`undefined` \| `Routing`\>

***

### selected

> **selected**: `Signal`\<`undefined` \| `boolean`\>

***

### stroke

> **stroke**: `InputSignal`\<`undefined` \| `string`\>

***

### strokeOpacity

> **strokeOpacity**: `InputSignal`\<`number`\>

***

### strokeWidth

> **strokeWidth**: `InputSignal`\<`number`\>

***

### temporary

> **temporary**: `Signal`\<`undefined` \| `boolean`\>
