---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "RelinkHandleDirective"
---

Turns its host element into a grabbable edge-endpoint handle: a pointerdown
starts the relink gesture for the given end of the given edge. The gesture
itself is handled at document level, so it keeps running after the host
element is removed from the DOM. This happens on every relink, because the
original edge is not rendered while its endpoint is being dragged.

`ng-diagram-base-edge` renders its own handles with this directive. Use it
directly in fully custom edge templates that do not use the base edge.
