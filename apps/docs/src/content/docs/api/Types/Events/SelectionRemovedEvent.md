---
editUrl: false
next: false
prev: false
title: "SelectionRemovedEvent"
---

Event payload emitted when selected elements are deleted from the diagram.

This event fires when the user deletes nodes and edges using the delete key,
or programmatically through the diagram service.

## Properties

### deletedEdges

> **deletedEdges**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Edges that were deleted from the diagram

***

### deletedNodes

> **deletedNodes**: [`Node`](/docs/api/types/model/node/)[]

Nodes that were deleted from the diagram
