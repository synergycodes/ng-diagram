---
editUrl: false
next: false
prev: false
title: "SelectionGroupChangedEvent"
---

Event payload emitted when nodes are grouped or ungrouped by moving them into/out of a group.
This event fires when the user moves nodes in or out of a group node.

## Properties

### nodes

> **nodes**: [`Node`](/docs/api/types/node/)[]

Nodes that were operated on (either grouped or ungrouped)

***

### targetGroup?

> `optional` **targetGroup**: [`GroupNode`](/docs/api/types/groupnode/)\<`object`\>

The target group node that received the nodes
