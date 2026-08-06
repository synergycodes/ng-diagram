---
version: "since v1.3.0"
editUrl: false
next: false
prev: false
title: "NgDiagramDefaultEdgeLabelComponent"
---

The `NgDiagramDefaultEdgeLabelComponent` wraps any projected content in the default
edge label chip — theme-aware background, rounded border and a highlighted border
while the edge is selected. Use it inside a [NgDiagramBaseEdgeLabelComponent](/docs/api/components/ngdiagrambaseedgelabelcomponent/)
to give a custom edge template the same label look as the default edge without
copying its styles.

The selected state is read from the surrounding edge component, so the component
must be used inside an edge template — instantiating it elsewhere fails with a
dependency injection error.

## Example usage
```html
<ng-diagram-base-edge [edge]="edge()">
  <ng-diagram-base-edge-label [id]="edge().id + '-label'" [positionOnEdge]="0.5">
    <ng-diagram-default-edge-label>{{ label() }}</ng-diagram-default-edge-label>
  </ng-diagram-base-edge-label>
</ng-diagram-base-edge>
```
