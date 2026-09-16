---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "RelinkHandleDirective"
---

Turns its host element into a grabbable edge-endpoint handle: a pointerdown
starts the relink gesture for the given end of the given edge. The gesture
itself is driven at document level — the host element unmounts when the
edge is hidden during the drag.

`ng-diagram-base-edge` renders its own handles with this directive; use it
directly in fully custom edge templates that do not compose the base edge.
