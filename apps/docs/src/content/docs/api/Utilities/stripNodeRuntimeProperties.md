---
version: "since v1.2.5"
editUrl: false
next: false
prev: false
title: "stripNodeRuntimeProperties"
---

> **stripNodeRuntimeProperties**(`node`): [`Node`](/docs/api/types/model/node/)

Strips runtime-computed properties from a node
(`selected`, `measuredPorts`, `measuredBounds`, `computedZIndex`, `_internalId`).

These properties are recomputed during initialization and stale values
from persistence cause the measurement system to skip fresh DOM measurement.

This is the default node strip function used by [initializeModel](/docs/api/utilities/initializemodel/) and
[initializeModelAdapter](/docs/api/utilities/initializemodeladapter/). When providing a custom strip function, wrap
this one instead of reimplementing it so future runtime properties stay covered.

## Parameters

### node

[`Node`](/docs/api/types/model/node/)

## Returns

[`Node`](/docs/api/types/model/node/)
