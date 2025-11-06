---
editUrl: false
next: false
prev: false
title: "NgDiagramNodeSelectedDirective"
---

The `NgDiagramNodeSelectedDirective` conditionally applies a selected class to a node in the diagram when it is selected.

## Example usage
```html
<div ngDiagramNodeSelected [node]="node()">
  <!-- Node content here -->
</div>
```

When the node's `selected` property is `true`, the `ng-diagram-node-selected` CSS class is applied.

## Properties

### node

> **node**: `InputSignal`\<[`Node`](/docs/api/types/model/node/)\>

The node instance to monitor for selection state.
