---
version: "since v1.4.0"
editUrl: false
next: false
prev: false
title: "NgDiagramHiddenDirective"
---

The `NgDiagramHiddenDirective` hides the node or edge whose template it is
used in — the template-level equivalent of the model `hidden` flag.

## Example usage
```html
<!-- inside a node or edge template -->
<div class="my-node" [ngDiagramHidden]="collapsed()">
  <!-- content -->
</div>
```

The element is hidden when the model flag, this binding, or inheritance
(hidden ancestor group, hidden edge endpoint) says so — every source feeds
the same effective visibility. Hidden elements stay mounted as
`display: none`, never block initialization or measurement waits, and are
excluded from every interactive surface (programmatic APIs such as
`select` do not filter hidden elements).

Not supported with virtualization: a hidden element leaves the virtualized
render set, which destroys the template declaring the binding. With
virtualization enabled the binding is ignored (with a console warning) —
use the model-level `hidden` flag instead.

## Implements

- `OnDestroy`

## Properties

### hidden

> **hidden**: `InputSignal`\<`boolean`\>

Whether the node or edge owning this template is hidden.
