---
version: "since v1.1.0"
editUrl: false
next: false
prev: false
title: "SelectionGestureEndedEvent"
---

Event payload emitted when a selection gesture is complete.

This event fires on pointerup after a selection operation completes —
whether from clicking a node/edge, box selection, or select-all.

## Properties

### edges

> **edges**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Currently selected edges after the selection gesture

***

### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

Currently selected nodes after the selection gesture
