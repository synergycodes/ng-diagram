---
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

### modifiers

> **modifiers**: [`InputModifiers`](/docs/api/types/configuration/shortcuts/inputmodifiers/)

Input modifiers (e.g., Ctrl, Shift) active during the drag.
