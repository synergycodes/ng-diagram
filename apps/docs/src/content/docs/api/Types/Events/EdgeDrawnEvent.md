---
editUrl: false
next: false
prev: false
title: "EdgeDrawnEvent"
---

Event payload emitted when a user manually draws an edge between two nodes.

This event only fires for user-initiated edge creation through the UI,
but not for programmatically added edges.

## Properties

### edge

> **edge**: [`Edge`](/docs/api/types/model/edge/)

The newly created edge object

***

### source

> **source**: [`Node`](/docs/api/types/model/node/)

The source node from which the edge originates

***

### sourcePort?

> `optional` **sourcePort**: `string`

Source port identifier if connected to a specific port

***

### target

> **target**: [`Node`](/docs/api/types/model/node/)

The target node to which the edge connects

***

### targetPort?

> `optional` **targetPort**: `string`

Target port identifier if connected to a specific port
