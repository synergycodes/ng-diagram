---
version: "since v1.2.5"
editUrl: false
next: false
prev: false
title: "InitializeModelOptions"
---

Options for [initializeModel](/docs/api/utilities/initializemodel/) and [initializeModelAdapter](/docs/api/utilities/initializemodeladapter/).

## Properties

### stripEdgeRuntimeProperties?

> `optional` **stripEdgeRuntimeProperties**: [`StripEdgeRuntimePropertiesFn`](/docs/api/types/model/stripedgeruntimepropertiesfn/)

Replaces the function that strips runtime-computed properties from edges
during initialization (and, for the default model created by
[initializeModel](/docs/api/utilities/initializemodel/), during `toJSON()` serialization).

⚠️ **Use at your own risk.** The default ([stripEdgeRuntimeProperties](/docs/api/utilities/stripedgeruntimeproperties/))
exists because stale runtime values (`sourcePosition`, `targetPosition`,
`measuredLabels`, `computedZIndex`, `_internalId`) loaded from persistence
can and probably will break the diagram — e.g. edges rendered at outdated
positions or duplicated internal ids. Overriding this function and keeping
such properties is unsupported territory; prefer wrapping the default and
re-adding only the properties you know you need.

***

### stripNodeRuntimeProperties?

> `optional` **stripNodeRuntimeProperties**: [`StripNodeRuntimePropertiesFn`](/docs/api/types/model/stripnoderuntimepropertiesfn/)

Replaces the function that strips runtime-computed properties from nodes
during initialization (and, for the default model created by
[initializeModel](/docs/api/utilities/initializemodel/), during `toJSON()` serialization).

⚠️ **Use at your own risk.** The default ([stripNodeRuntimeProperties](/docs/api/utilities/stripnoderuntimeproperties/))
exists because stale runtime values (`selected`, `measuredPorts`,
`measuredBounds`, `computedZIndex`, `_internalId`) loaded from persistence
can and probably will break the diagram — e.g. skipped DOM measurements,
wrong z-ordering, or duplicated internal ids. Overriding this function and
keeping such properties is unsupported territory; prefer wrapping the
default and re-adding only the properties you know you need.
