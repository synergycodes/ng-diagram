---
editUrl: false
next: false
prev: false
title: "SelectionRemovedEvent"
---

Event payload emitted when selected elements are deleted from the diagram.
This event fires when the user deletes nodes and edges using the delete key,
context menu, or programmatically through the diagram service.

## Properties

### deletedEdges

> **deletedEdges**: [`Edge`](/docs/api/types/edge/)\<`object`\>[]

Edges that were deleted from the diagram

***

### deletedNodes

> **deletedNodes**: [`Node`](/docs/api/types/node/)[]

Nodes that were deleted from the diagram
