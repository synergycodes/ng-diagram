---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "NodeDragEndedEvent"
---

Event payload emitted when a node drag operation ends.

This event fires when the user releases the pointer after dragging nodes.
Nodes will have their final positions when this event is received.

## Properties

### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

Nodes that were dragged, with their final positions
