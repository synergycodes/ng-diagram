---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramGroupHighlightedDirective"
---

The `NgDiagramGroupHighlightedDirective` conditionally applies a highlight class to a group node in the diagram when it is highlighted.

## Example usage
```html
<div ngDiagramGroupHighlighted [node]="node">
  <!-- Group node content here -->
</div>
```

When the group's [GroupNode#highlighted](/docs/api/types/model/groupnode/#highlighted) property is `true`, the `ng-diagram-group-highlight` CSS class is applied.

## Properties

### node

> **node**: `InputSignal`\<[`GroupNode`](/docs/api/types/model/groupnode/)\<`object`\>\>

The group node instance to monitor for highlight state.
