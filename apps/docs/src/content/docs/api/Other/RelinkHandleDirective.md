---
editUrl: false
next: false
prev: false
title: "RelinkHandleDirective"
---

Turns its host element into a grabbable edge-endpoint handle: a pointerdown
starts the relink gesture for the given end of the given edge. The gesture
itself is driven by RelinkingGestureService at document level — the
host element unmounts when the edge is hidden during the drag.
