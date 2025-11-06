---
editUrl: false
next: false
prev: false
title: "ActionState"
---

Interface representing the current state of various user interactions in the diagram.

This state is read-only and automatically managed by the library. It provides
information about active operations such as resizing, linking, dragging, and other
user interactions. Use this to observe the current state, not to modify it.

## Properties

### copyPaste?

> `optional` **copyPaste**: [`CopyPasteActionState`](/docs/api/internals/copypasteactionstate/)

State related to copy-paste actions

***

### dragging?

> `optional` **dragging**: [`DraggingActionState`](/docs/api/internals/draggingactionstate/)

State related to dragging elements

***

### highlightGroup?

> `optional` **highlightGroup**: [`HighlightGroupActionState`](/docs/api/internals/highlightgroupactionstate/)

State related to highlighting groups

***

### linking?

> `optional` **linking**: [`LinkingActionState`](/docs/api/internals/linkingactionstate/)

State related to linking nodes

***

### resize?

> `optional` **resize**: [`ResizeActionState`](/docs/api/internals/resizeactionstate/)

State related to node resizing action

***

### rotation?

> `optional` **rotation**: [`RotationActionState`](/docs/api/internals/rotationactionstate/)

State related to node rotation
