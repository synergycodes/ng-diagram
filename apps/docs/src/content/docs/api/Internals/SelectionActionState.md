---
version: "since v1.1.2"
editUrl: false
next: false
prev: false
title: "SelectionActionState"
---

State tracking whether a selection gesture has changed the selection.

Set by selection commands when they apply changes, cleared when
the `selectionGestureEnded` event is emitted on `selectEnd`.

## Properties

### selectionChanged

> **selectionChanged**: `boolean`

Whether selection has changed since the gesture started.
