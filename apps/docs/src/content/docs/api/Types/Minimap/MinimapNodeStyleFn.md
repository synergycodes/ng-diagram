---
version: "since v1.0.0"
editUrl: false
next: false
prev: false
title: "MinimapNodeStyleFn"
---

> **MinimapNodeStyleFn** = (`node`) => [`MinimapNodeStyle`](/docs/api/types/minimap/minimapnodestyle/) \| `null` \| `undefined`

Function signature for the nodeStyle callback.
Return style properties to override defaults, or null/undefined to use defaults.

## Parameters

### node

[`Node`](/docs/api/types/model/node/)

## Returns

[`MinimapNodeStyle`](/docs/api/types/minimap/minimapnodestyle/) \| `null` \| `undefined`

## Example

```typescript
const nodeStyle: MinimapNodeStyleFn = (node) => ({
  fill: node.type === 'database' ? '#4CAF50' : '#9E9E9E',
  opacity: node.selected ? 1 : 0.6,
});
```
