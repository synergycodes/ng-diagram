---
version: "since v0.9.1"
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

- `OnDestroy`

## Properties

### height

> **height**: `InputSignal`\<`number`\>

Height of the minimap in pixels.

***

### position

> **position**: `InputSignal`\<[`NgDiagramPanelPosition`](/docs/api/types/ngdiagrampanelposition/)\>

Position of the minimap panel within the diagram container.

***

### width

> **width**: `InputSignal`\<`number`\>

Width of the minimap in pixels.
