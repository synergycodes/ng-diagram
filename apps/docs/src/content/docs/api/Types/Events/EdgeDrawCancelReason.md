---
version: "since v1.2.0"
editUrl: false
next: false
prev: false
title: "EdgeDrawCancelReason"
---

> **EdgeDrawCancelReason** = `"noTarget"` \| `"invalidConnection"` \| `"invalidTarget"` \| `"cancelled"`

Reason an edge draw gesture was cancelled.

- `noTarget` — the user released on empty space (no target node/port snapped)
- `invalidConnection` — `validateConnection()` returned false
- `invalidTarget` — the target node doesn't exist or the target port has wrong type
- `cancelled` — the gesture was aborted programmatically (e.g. Esc key,
  [NgDiagramService.cancelActiveInteraction](/docs/api/services/ngdiagramservice/#cancelactiveinteraction))
