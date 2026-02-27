---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "NodeResizeEndedEvent"
---

Event payload emitted when a node resize operation ends.

This event fires when the user releases the pointer after resizing a node.
The node will have its final size when this event is received.

## Properties

### node

> **node**: [`Node`](/docs/api/types/model/node/)

The node that was resized, with its final size
