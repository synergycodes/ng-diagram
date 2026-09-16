---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "EdgeRelinkingConfig"
---

Configuration for interactive edge relinking — dragging an endpoint of an
existing edge to reconnect it to another port or leave it dangling.

## Properties

### enabled

> **enabled**: `boolean`

Enables the relinking gesture. When true, a selected edge shows grabbable
endpoint handles; dragging one previews the reconnection live and commits
it on drop. Dropping on empty canvas leaves the endpoint dangling when
`danglingEdges.enabled` is true, otherwise the relink is reverted.

Connections made by relinking are validated through
`linking.validateConnection`, which receives a context with
`reason: 'relink'` and the edge being relinked.

#### Default

```ts
false
```
