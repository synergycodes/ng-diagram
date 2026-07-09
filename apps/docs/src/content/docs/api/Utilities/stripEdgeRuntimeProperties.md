---
version: "since v1.2.5"
editUrl: false
next: false
prev: false
title: "stripEdgeRuntimeProperties"
---

> **stripEdgeRuntimeProperties**(`edge`): [`Edge`](/docs/api/types/model/edge/)

Strips runtime-computed properties from an edge
(`sourcePosition`, `targetPosition`, `measuredLabels`, `computedZIndex`, `_internalId`).

These properties are recomputed during initialization and stale values
from persistence cause the measurement system to skip fresh DOM measurement.

This is the default edge strip function used by [initializeModel](/docs/api/utilities/initializemodel/) and
[initializeModelAdapter](/docs/api/utilities/initializemodeladapter/). When providing a custom strip function, wrap
this one instead of reimplementing it so future runtime properties stay covered.

## Parameters

### edge

[`Edge`](/docs/api/types/model/edge/)

## Returns

[`Edge`](/docs/api/types/model/edge/)
