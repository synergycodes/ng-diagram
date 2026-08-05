---
version: "since v0.8.0"
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

### defaultResizable

> **defaultResizable**: `InputSignal`\<`undefined` \| `boolean`\>

Whether the node is resizable.

#### Default

```ts
undefined
```

***

### resizeEdges

> **resizeEdges**: `InputSignal`\<readonly [`ResizeEdge`](/docs/api/types/templates/resizeedge/)[]\>

Which edges of the node can be grabbed to resize it.

All four lines always render, since they double as the node's selection frame, but the ones
for edges left out here are inert: they do not start a resize and show no resize cursor.
A corner handle renders only when both of its edges are listed, so
`['right', 'bottom']` leaves only the bottom-right handle.

Pass an empty array to keep the selection frame without allowing any interactive resize.

#### Default

```ts
['top', 'right', 'bottom', 'left']
```

#### Since

1.3.0

#### Example

```html
<ng-diagram-node-resize-adornment [resizeEdges]="['right', 'bottom']">
  <!-- Node content here -->
</ng-diagram-node-resize-adornment>
```
