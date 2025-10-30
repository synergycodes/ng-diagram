---
editUrl: false
next: false
prev: false
title: "FlowConfig"
---

The main configuration interface for the flow system.

## Properties

### background

> **background**: [`BackgroundConfig`](/docs/api/types/backgroundconfig/)

Configuration for background behavior.

***

### computeEdgeId()

> **computeEdgeId**: () => `string`

Computes a unique ID for an edge.

#### Returns

`string`

The edge's unique ID.

***

### computeNodeId()

> **computeNodeId**: () => `string`

Computes a unique ID for a node.

#### Returns

`string`

The node's unique ID.

***

### debugMode

> **debugMode**: `boolean`

Enables or disables debug mode for the diagram.
When enabled, additional console logs are printed.

***

### edgeRouting

> **edgeRouting**: [`EdgeRoutingConfig`](/docs/api/types/edgeroutingconfig/)

Configuration for edge routing.

***

### grouping

> **grouping**: [`GroupingConfig`](/docs/api/types/groupingconfig/)

Configuration for node grouping.

***

### linking

> **linking**: [`LinkingConfig`](/docs/api/types/linkingconfig/)

Configuration for linking (edge creation).

***

### nodeRotation

> **nodeRotation**: [`NodeRotationConfig`](/docs/api/types/noderotationconfig/)

Configuration for node rotation behavior.

***

### resize

> **resize**: [`ResizeConfig`](/docs/api/types/resizeconfig/)

Configuration for node resizing.

***

### selectionMoving

> **selectionMoving**: [`SelectionMovingConfig`](/docs/api/types/selectionmovingconfig/)

Configuration for selection moving behavior.

***

### shortcuts

> **shortcuts**: `ShortcutDefinition`[]

Configuration for keyboard shortcuts.
This is the resolved array of shortcuts after initialization.

#### Remarks

During initialization, you can provide either:
- Array of ShortcutDefinition to completely override defaults
- Factory function receiving default shortcuts and returning modified array

The function will be resolved during config creation.

***

### snapping

> **snapping**: [`SnappingConfig`](/docs/api/types/snappingconfig/)

Configuration for snapping behavior.

***

### zIndex

> **zIndex**: [`ZIndexConfig`](/docs/api/types/zindexconfig/)

Configuration for z-index layering behavior.

***

### zoom

> **zoom**: [`ZoomConfig`](/docs/api/types/zoomconfig/)

Configuration for zooming.
