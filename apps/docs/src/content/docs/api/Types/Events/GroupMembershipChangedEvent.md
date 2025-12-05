---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "GroupMembershipChangedEvent"
---

Event payload emitted when nodes are grouped or ungrouped.

This event fires when the user moves nodes in or out of a group node,
changing their group membership status.

## Properties

### grouped

> **grouped**: `object`[]

Nodes added to groups, organized by target group

#### nodes

> **nodes**: [`Node`](/docs/api/types/model/node/)[]

#### targetGroup

> **targetGroup**: [`GroupNode`](/docs/api/types/model/groupnode/)

***

### ungrouped

> **ungrouped**: [`Node`](/docs/api/types/model/node/)[]

Nodes removed from groups
