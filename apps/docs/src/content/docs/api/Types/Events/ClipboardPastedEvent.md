---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ClipboardPastedEvent"
---

Event payload emitted when clipboard content is pasted into the diagram.

This event fires when nodes and edges are added via paste operations,
either through keyboard shortcuts or programmatic paste commands.

## Properties

### edges

> **edges**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Edges that were pasted into the diagram

***

### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

Nodes that were pasted into the diagram
