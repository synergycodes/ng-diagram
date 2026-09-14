---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkCancelReason"
---

> **EdgeRelinkCancelReason** = `"noTarget"` \| `"invalidConnection"` \| `"cancelled"`

Reason an edge relink gesture ended without changing the edge.

- `noTarget` — dropped on empty canvas while dangling edges are disabled
- `invalidConnection` — the candidate connection failed validation
- `cancelled` — the gesture was aborted (Esc key,
  [NgDiagramService.cancelActiveInteraction](/docs/api/services/ngdiagramservice/#cancelactiveinteraction), or another gesture
  claimed the pointer)
