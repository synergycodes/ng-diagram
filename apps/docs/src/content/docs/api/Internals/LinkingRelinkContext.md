---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "LinkingRelinkContext"
---

Context of an edge relink gesture carried inside the linking action state.

## Properties

### edgeId

> **edgeId**: `string`

ID of the edge whose endpoint is being dragged.

***

### end

> **end**: [`EdgeEnd`](/docs/api/types/model/edgeend/)

Which endpoint of the edge is being dragged.

***

### originalEdge

> **originalEdge**: [`Edge`](/docs/api/types/model/edge/)

Snapshot of the edge as it was when the gesture started.
