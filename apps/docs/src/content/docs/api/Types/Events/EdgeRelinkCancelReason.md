---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkCancelReason"
---

> **EdgeRelinkCancelReason** = `"noTarget"` \| `"invalidConnection"` \| `"cancelled"`

Reason an edge relink gesture ended without changing the edge.

- `noTarget` — the endpoint was dropped on empty canvas while dangling
  edges are disabled, or `danglingEdges.shouldKeepOnDrop` returned false
  for the detached edge
- `invalidConnection` — the drop target failed validation: it was rejected
  by `linking.validateConnection` (context reason `relink`), or it is not a
  valid target at all (hidden node, hidden or missing port, port with the
  wrong direction)
- `cancelled` — the gesture was aborted (Esc key,
  [NgDiagramService.cancelActiveInteraction](/docs/api/services/ngdiagramservice/#cancelactiveinteraction), or another gesture took
  over the pointer), or the endpoint was dropped back on its original node
  and port, which changes nothing
