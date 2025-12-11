---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "LinkingActionState"
---

State tracking an edge creation operation in progress.

## Properties

### sourceNodeId

> **sourceNodeId**: `string`

ID of the node where the edge starts.

***

### sourcePortId

> **sourcePortId**: `string`

ID of the port where the edge starts.

***

### temporaryEdge

> **temporaryEdge**: `null` \| [`Edge`](/docs/api/types/model/edge/)\<`object`\>

Temporary edge displayed while creating the connection.
