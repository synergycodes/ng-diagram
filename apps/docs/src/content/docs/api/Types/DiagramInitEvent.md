---
editUrl: false
next: false
prev: false
title: "DiagramInitEvent"
---

Event payload emitted when the diagram initialization is complete.
This event fires after all nodes and edges including their internal parts have been measured and positioned.

## Properties

### edges

> **edges**: [`Edge`](/docs/api/types/edge/)\<`object`\>[]

All edges present in the diagram after initialization

***

### nodes

> **nodes**: [`Node`](/docs/api/types/node/)[]

All nodes present in the diagram after initialization

***

### viewport

> **viewport**: `Viewport`

Current viewport configuration including position and scale
