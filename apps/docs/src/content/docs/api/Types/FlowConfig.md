---
editUrl: false
next: false
prev: false
title: "FlowConfig"
---

The main configuration interface for the flow system.

This type defines all available configuration options for the diagram engine.

For most use cases, you should use [NgDiagramConfig](/docs/api/types/ngdiagramconfig/), which allows you to override only the properties you need.

## Properties

### background

> **background**: [`BackgroundConfig`](/docs/api/types/backgroundconfig/)

Configuration for background behavior.

***

### boxSelection

> **boxSelection**: [`BoxSelectionConfig`](/docs/api/types/boxselectionconfig/)

Configuration for box selection behavior.

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

#### Default

```ts
false
```

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

> **shortcuts**: [`ShortcutDefinition`](/docs/api/other/shortcutdefinition/)[]

Configuration for keyboard shortcuts.

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
