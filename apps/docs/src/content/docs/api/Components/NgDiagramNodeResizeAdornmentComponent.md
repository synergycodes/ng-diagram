---
editUrl: false
next: false
prev: false
title: "NgDiagramNodeResizeAdornmentComponent"
---

The `NgDiagramNodeResizeAdornmentComponent` displays resize handles and lines around a selected, resizable node.

## Example usage
```html
<ng-diagram-node-resize-adornment>
  <!-- Node content here -->
</ng-diagram-node-resize-adornment>
```

## Extends

- `NodeContextGuardBase`

## Properties

### value

> **value**: `InputSignal`\<`undefined` \| `boolean`\>

Whether the node is resizable.
Takes precedence over Node.resizable.

#### Default

```ts
undefined
```
