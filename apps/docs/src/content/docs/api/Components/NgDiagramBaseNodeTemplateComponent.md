---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "NgDiagramBaseNodeTemplateComponent"
---

The `NgDiagramBaseNodeTemplateComponent` provides a base template for custom nodes with default node styling and features.

This component wraps custom node content while providing the default node's visual appearance, selection states,
resize and rotate adornments, and default ports. Use this as a convenient way to create custom nodes that
maintain the default node's look and feel while adding custom content.

## Example

```html
<ng-diagram-base-node-template [node]="node">
  <!-- Custom node content here -->
  <div class="custom-header">{{ node().data.title }}</div>
  <div class="custom-body">{{ node().data.description }}</div>
</ng-diagram-base-node-template>
```

## Implements

- [`NgDiagramNodeTemplate`](/docs/api/types/templates/ngdiagramnodetemplate/)

## Properties

### node

> **node**: `InputSignal`\<[`Node`](/docs/api/types/model/node/)\>

Input signal containing the node data and properties.

#### Implementation of

[`NgDiagramNodeTemplate`](/docs/api/types/templates/ngdiagramnodetemplate/).[`node`](/docs/api/types/templates/ngdiagramnodetemplate/#node)
