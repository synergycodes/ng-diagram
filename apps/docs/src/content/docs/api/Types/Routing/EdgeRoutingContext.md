---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "EdgeRoutingContext"
---

Context object containing all information needed for routing computation

## Properties

### edge

> **edge**: [`Edge`](/docs/api/types/model/edge/)

The edge being routed

***

### sourceNode?

> `optional` **sourceNode**: [`Node`](/docs/api/types/model/node/)

Source node

***

### sourcePoint

> **sourcePoint**: [`PortLocation`](/docs/api/types/model/portlocation/)

Source port location

***

### sourcePort?

> `optional` **sourcePort**: [`Port`](/docs/api/types/model/port/)

Source port (if edge is connected to a specific port)

***

### targetNode?

> `optional` **targetNode**: [`Node`](/docs/api/types/model/node/)

Target node

***

### targetPoint

> **targetPoint**: [`PortLocation`](/docs/api/types/model/portlocation/)

Target port location

***

### targetPort?

> `optional` **targetPort**: [`Port`](/docs/api/types/model/port/)

Target port (if edge is connected to a specific port)
