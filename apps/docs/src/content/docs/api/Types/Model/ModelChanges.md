---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "ModelChanges"
---

Interface representing a snapshot of the diagram model state.

This read-only interface is provided by the library when the model changes.
It contains the complete current state of nodes, edges, and metadata.
Typically received in `onChange` callbacks to observe model updates.

## Properties

### edges

> **edges**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>[]

Current array of all edges in the diagram.

***

### metadata

> **metadata**: [`Metadata`](/docs/api/types/model/metadata/)

Current metadata associated with the diagram.

***

### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

Current array of all nodes in the diagram.
