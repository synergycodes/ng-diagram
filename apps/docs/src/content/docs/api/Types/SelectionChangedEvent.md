---
editUrl: false
next: false
prev: false
title: "SelectionChangedEvent"
---

Event payload emitted when the selection state changes in the diagram.

This event fires when the user selects or deselects nodes and edges through clicking
or programmatically using the `NgDiagramSelectionService`.

## Properties

### previousEdges

> **previousEdges**: [`Edge`](/docs/api/types/edge/)\<`object`\>[]

Previously selected edges before the change

***

### previousNodes

> **previousNodes**: [`Node`](/docs/api/types/node/)[]

Previously selected nodes before the change

***

### selectedEdges

> **selectedEdges**: [`Edge`](/docs/api/types/edge/)\<`object`\>[]

Currently selected edges

***

### selectedNodes

> **selectedNodes**: [`Node`](/docs/api/types/node/)[]

Currently selected nodes
