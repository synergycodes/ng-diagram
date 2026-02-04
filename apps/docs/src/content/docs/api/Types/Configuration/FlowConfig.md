---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "FlowConfig"
---

The main configuration interface for the flow system.

This type defines all available configuration options for the diagram engine.

For most use cases, you should use [NgDiagramConfig](/docs/api/types/configuration/ngdiagramconfig/), which allows you to override only the properties you need.

## Properties

### background

> **background**: [`BackgroundConfig`](/docs/api/types/configuration/features/backgroundconfig/)

Configuration for background behavior.

***

### boxSelection

> **boxSelection**: [`BoxSelectionConfig`](/docs/api/types/configuration/features/boxselectionconfig/)

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

> **edgeRouting**: [`EdgeRoutingConfig`](/docs/api/types/configuration/features/edgeroutingconfig/)

Configuration for edge routing.

***

### grouping

> **grouping**: [`GroupingConfig`](/docs/api/types/configuration/features/groupingconfig/)

Configuration for node grouping.

***

### hideWatermark?

> `optional` **hideWatermark**: `boolean`

#### Since

0.9.0

Hides the ngDiagram watermark when set to true.

#### Default

```ts
undefined
```

***

### linking

> **linking**: [`LinkingConfig`](/docs/api/types/configuration/features/linkingconfig/)

Configuration for linking (edge creation).

***

### nodeDraggingEnabled

> **nodeDraggingEnabled**: `boolean`

#### Since

1.0.0

Enables or disables node dragging on the diagram.
When set to false, users cannot move nodes via mouse dragging or keyboard arrow keys.

#### Default

```ts
true
```

***

### nodeRotation

> **nodeRotation**: [`NodeRotationConfig`](/docs/api/types/configuration/features/noderotationconfig/)

Configuration for node rotation behavior.

***

### resize

> **resize**: [`ResizeConfig`](/docs/api/types/configuration/features/resizeconfig/)

Configuration for node resizing.

***

### selectionMoving

> **selectionMoving**: [`SelectionMovingConfig`](/docs/api/types/configuration/features/selectionmovingconfig/)

Configuration for selection moving behavior.

***

### shortcuts

> **shortcuts**: [`ShortcutDefinition`](/docs/api/types/configuration/shortcuts/shortcutdefinition/)[]

Configuration for keyboard shortcuts.

***

### snapping

> **snapping**: [`SnappingConfig`](/docs/api/types/configuration/features/snappingconfig/)

Configuration for snapping behavior.

***

### viewportPanningEnabled

> **viewportPanningEnabled**: `boolean`

#### Since

0.9.0

Enables or disables panning on the diagram.
When set to false, user is not able to move the viewport by panning.

#### Default

```ts
true
```

***

### virtualization

> **virtualization**: [`VirtualizationConfig`](/docs/api/types/configuration/features/virtualizationconfig/)

Configuration for viewport virtualization.
Improves performance for large diagrams by only rendering visible elements.

***

### zIndex

> **zIndex**: [`ZIndexConfig`](/docs/api/types/configuration/features/zindexconfig/)

Configuration for z-index layering behavior.

***

### zoom

> **zoom**: [`ZoomConfig`](/docs/api/types/configuration/features/zoomconfig/)

Configuration for zooming.
