---
editUrl: false
next: false
prev: false
title: "SelectionRotatedEvent"
---

Event payload emitted when a node is rotated in the diagram.

This event fires when the user rotates a node manually using the rotation handle
or programmatically using the [NgDiagramNodeService](/docs/api/services/ngdiagramnodeservice/) rotation methods.

## Properties

### angle

> **angle**: `number`

The new angle of the node in degrees

***

### node

> **node**: [`Node`](/docs/api/types/model/node/)

The node that was rotated

***

### previousAngle

> **previousAngle**: `number`

The previous angle of the node in degrees
