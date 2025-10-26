---
editUrl: false
next: false
prev: false
title: "SelectionGroupedEvent"
---

Event payload emitted when nodes are grouped by moving them into a group.
This event fires when the user moves nodes onto a group node, causing them
to be assigned to that group's groupId.

## Properties

### groupedNodes

> **groupedNodes**: [`Node`](/docs/api/types/node/)[]

Nodes that were added to the group

***

### targetGroup

> **targetGroup**: [`GroupNode`](/docs/api/types/groupnode/)

The target group node that received the nodes
