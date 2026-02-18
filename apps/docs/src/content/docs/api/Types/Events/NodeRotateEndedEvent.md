---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "NodeRotateEndedEvent"
---

Event payload emitted when a node rotation operation ends.

This event fires when the user releases the pointer after rotating a node.
The node will have its final angle when this event is received.

## Properties

### node

> **node**: [`Node`](/docs/api/types/model/node/)

The node that was rotated, with its final angle
