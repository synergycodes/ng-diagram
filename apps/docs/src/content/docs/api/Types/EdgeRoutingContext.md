---
editUrl: false
next: false
prev: false
title: "EdgeRoutingContext"
---

Context object containing all information needed for routing computation

## Properties

### edge

> **edge**: [`Edge`](/docs/api/types/edge/)

The edge being routed

***

### sourceNode?

> `optional` **sourceNode**: [`Node`](/docs/api/types/node/)

Source node

***

### sourcePoint

> **sourcePoint**: [`PortLocation`](/docs/api/types/portlocation/)

Source port location

***

### sourcePort?

> `optional` **sourcePort**: [`Port`](/docs/api/types/port/)

Source port (if edge is connected to a specific port)

***

### targetNode?

> `optional` **targetNode**: [`Node`](/docs/api/types/node/)

Target node

***

### targetPoint

> **targetPoint**: [`PortLocation`](/docs/api/types/portlocation/)

Target port location

***

### targetPort?

> `optional` **targetPort**: [`Port`](/docs/api/types/port/)

Target port (if edge is connected to a specific port)
