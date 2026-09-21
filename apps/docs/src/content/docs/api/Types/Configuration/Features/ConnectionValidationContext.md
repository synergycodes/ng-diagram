---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "ConnectionValidationContext"
---

Context passed to [LinkingConfig.validateConnection](/docs/api/types/configuration/features/linkingconfig/#validateconnection). It describes the
operation that is being validated.

- `draw` — a new edge is being drawn, by a pointer gesture or by
  `startLinking` / `startLinkingFromPosition`.
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
