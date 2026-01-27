---
version: "since v1.0.0"
editUrl: false
next: false
prev: false
title: "NgDiagramMinimapComponent"
---

A minimap component that displays a bird's-eye view of the diagram.

Shows all nodes as small rectangles and a viewport rectangle indicating
the currently visible area. The minimap updates reactively when the
diagram viewport changes (pan/zoom) or when nodes are added/removed/updated.

The minimap also supports navigation: click and drag on the minimap to pan
the diagram viewport to different areas.

## Implements

- `AfterViewInit`
- `OnDestroy`

## Properties

### height

> **height**: `InputSignal`\<`number`\>

Height of the minimap in pixels.

***

### minimapNodeTemplateMap

> **minimapNodeTemplateMap**: `InputSignal`\<[`NgDiagramMinimapNodeTemplateMap`](/docs/api/types/minimap/ngdiagramminimapnodetemplatemap/)\>

Optional template map for complete control over node rendering per node type.
Components registered in the map should render SVG elements.

#### Example

```typescript
const minimapTemplateMap = new NgDiagramMinimapNodeTemplateMap([
  ['database', DatabaseMinimapNodeComponent],
  ['api', ApiMinimapNodeComponent],
]);

// Usage:
<ng-diagram-minimap [minimapNodeTemplateMap]="minimapTemplateMap" />
```

***

### nodeStyle

> **nodeStyle**: `InputSignal`\<`undefined` \| [`MinimapNodeStyleFn`](/docs/api/types/minimap/minimapnodestylefn/)\>

Optional callback function to customize node styling.
Return style properties to override defaults, or null/undefined to use CSS defaults.

#### Example

```typescript
nodeStyle = (node: Node) => ({
  fill: node.type === 'database' ? '#4CAF50' : '#9E9E9E',
  opacity: node.selected ? 1 : 0.6,
});
```

***

### position

> **position**: `InputSignal`\<[`NgDiagramPanelPosition`](/docs/api/types/ngdiagrampanelposition/)\>

Position of the minimap panel within the diagram container.

***

### width

> **width**: `InputSignal`\<`number`\>

Width of the minimap in pixels.
