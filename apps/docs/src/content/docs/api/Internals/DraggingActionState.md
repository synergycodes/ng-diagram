---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "DraggingActionState"
---

State tracking a drag operation in progress.

## Properties

### accumulatedDeltas

> **accumulatedDeltas**: `Map`\<`string`, [`Point`](/docs/api/types/geometry/point/)\>

Accumulated deltas per node that haven't yet resulted in a snap movement.
Key is node ID, value is the accumulated delta that hasn't been applied due to snapping.

***

### cancelReason?

> `optional` **cancelReason**: `"cancelled"`

Set when the drag is aborted; carried into `nodeDragEnded`.

***

### initialPositions?

> `optional` **initialPositions**: `Map`\<`string`, [`Point`](/docs/api/types/geometry/point/)\>

Positions of the dragged nodes captured when the move threshold was crossed,
used to restore them when the drag is cancelled.

***

### modifiers

> **modifiers**: [`InputModifiers`](/docs/api/types/configuration/shortcuts/inputmodifiers/)

Input modifiers (e.g., Ctrl, Shift) active during the drag.

***

### movementStarted

> **movementStarted**: `boolean`

Whether the pointer has moved beyond the move threshold, indicating an actual drag.
`false` when the drag state is first created (on pointer down), `true` once movement exceeds the threshold.

***

### nodeIds

> **nodeIds**: `string`[]

IDs of all nodes participating in the drag (selected + children, filtered by draggable).
