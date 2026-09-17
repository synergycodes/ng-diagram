---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "ConnectionValidationContext"
---

Context passed to [LinkingConfig.validateConnection](/docs/api/types/configuration/features/linkingconfig/#validateconnection) describing the
operation that asks for validation.

- `draw` — a new edge is being drawn (gesture or `startLinking*`).
- `relink` — an endpoint of `edge` is being dragged to a new target.
- `attach` — `NgDiagramModelService.attachEdge` connects an endpoint of `edge`.

## Properties

### edge?

> `optional` **edge**: [`Edge`](/docs/api/types/model/edge/)\<`object`\>

The existing edge whose endpoint is being connected (relink and attach only).

***

### end?

> `optional` **end**: [`EdgeEnd`](/docs/api/types/model/edgeend/)

Which endpoint of `edge` is being connected (relink and attach only).

***

### reason

> **reason**: `"draw"` \| `"relink"` \| `"attach"`

The operation being validated.
