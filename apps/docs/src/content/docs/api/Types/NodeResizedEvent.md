---
editUrl: false
next: false
prev: false
title: "NodeResizedEvent"
---

Event payload emitted when a node or group size changes.

This event fires when a node is resized manually by dragging resize handles
or programmatically using resize methods.

## Properties

### node

> **node**: [`Node`](/docs/api/types/node/)

Node that was resized with its updated size

***

### previousSize

> **previousSize**: [`Size`](/docs/api/types/size/)

Previous size of the node before the change
