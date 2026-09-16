---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkCancelReason"
---

> **EdgeRelinkCancelReason** = `"noTarget"` \| `"invalidConnection"` \| `"cancelled"`

Reason an edge relink gesture ended without changing the edge.

- `noTarget` — dropped on empty canvas while dangling edges are disabled,
  or `danglingEdges.shouldKeepOnDrop` declined the detached edge
- `invalidConnection` — the drop target failed validation: rejected by
  `linking.validateConnection` (context reason `relink`), or structurally
  invalid (hidden node, hidden/missing port, wrong-direction port)
- `cancelled` — the gesture was aborted (Esc key,
  [NgDiagramService.cancelActiveInteraction](/docs/api/services/ngdiagramservice/#cancelactiveinteraction), another gesture claimed
  the pointer) or the endpoint was dropped back on its original node and
  port, which changes nothing
