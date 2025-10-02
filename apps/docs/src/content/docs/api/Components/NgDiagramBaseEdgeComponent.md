---
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

Base edge component that handles edge rendering.
It can be extended or used directly to render edges in the diagram.

## Properties

### edge

> **edge**: `InputSignal`\<[`Edge`](/docs/api/types/edge/)\<`object`\>\>

Edge data model

***

### routing

> **routing**: `InputSignal`\<`undefined` \| `string`\>

Edge routing mode

***

### sourceArrowhead

> **sourceArrowhead**: `InputSignal`\<`undefined` \| `string`\>

ID of a source <marker> element in the SVG document. Edge model data has precedence over this property.

***

### stroke

> **stroke**: `InputSignal`\<`undefined` \| `string`\>

Stroke color of the edge. Edge model data has precedence over this property.

***

### strokeDasharray

> **strokeDasharray**: `InputSignal`\<`undefined` \| `string`\>

Stroke dash array of the edge (e.g., '5 5' for dashed line, '10 5 2 5' for dash-dot pattern).

***

### strokeOpacity

> **strokeOpacity**: `InputSignal`\<`number`\>

Stroke opacity of the edge

***

### strokeWidth

> **strokeWidth**: `InputSignal`\<`number`\>

Stroke width of the edge

***

### targetArrowhead

> **targetArrowhead**: `InputSignal`\<`undefined` \| `string`\>

ID of a target <marker> element in the SVG document. Edge model data has precedence over this property.
