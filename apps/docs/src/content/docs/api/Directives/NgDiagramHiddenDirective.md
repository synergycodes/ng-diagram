---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "NgDiagramHiddenDirective"
---

The `NgDiagramHiddenDirective` hides the node or edge from inside its
template. It is the template equivalent of the model `hidden` flag.

## Example usage
```html
<!-- inside a node or edge template -->
<div class="my-node" [ngDiagramHidden]="collapsed()">
  <!-- content -->
</div>
```

The element is hidden when any of these applies: the model `hidden` flag,
this binding, a hidden ancestor group, or (for edges) a hidden endpoint
node. All of them feed the same effective visibility. Hidden elements stay
in the DOM with `display: none`, never block initialization or
`waitForMeasurements`, and are ignored by user interactions. Programmatic
APIs such as `select` do not skip hidden elements.

Not supported with virtualization: hiding the element would remove the
template that holds the binding. With virtualization enabled the binding is
ignored and a console warning is logged. Use the model `hidden` flag
instead.

## Implements

- `OnDestroy`

## Properties

### hidden

> **hidden**: `InputSignalWithTransform`\<`boolean`, `unknown`\>

Whether the node or edge that owns this template is hidden.

A plain `ngDiagramHidden` attribute without a binding also works and
means hidden, like the native HTML `hidden` attribute.
