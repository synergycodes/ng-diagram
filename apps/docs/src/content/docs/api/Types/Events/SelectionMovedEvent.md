---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "SelectionMovedEvent"
---

Event payload emitted when selected nodes are moved within the diagram.

This event fires when the user moves nodes manually by dragging or programmatically
using the [NgDiagramNodeService.moveNodesBy](/docs/api/services/ngdiagramnodeservice/#movenodesby) method.

## Properties

### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

Nodes that were moved with their updated positions
