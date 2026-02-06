---
version: "since v1.0.0"
editUrl: false
next: false
prev: false
title: "NgDiagramMinimapNodeTemplate"
---

Interface for custom minimap node components.
Components implementing this interface can be registered in NgDiagramMinimapNodeTemplateMap
to customize how specific node types are rendered in the minimap.

Custom templates are rendered inside a foreignObject that handles positioning and sizing,
so the component only needs to render content that fills its container.

## Example

```typescript
@Component({
  selector: 'my-minimap-node',
  standalone: true,
  template: `
    <div class="minimap-icon" [style.background]="node().data?.color">
      {{ node().type }}
    </div>
  `,
  styles: [`.minimap-icon { width: 100%; height: 100%; }`]
})
export class MyMinimapNodeComponent implements NgDiagramMinimapNodeTemplate {
  node = input.required<Node>();
  nodeStyle = input<MinimapNodeStyle>(); // Required by interface, can be ignored if not needed
}
```

## Properties

### node

> **node**: `InputSignal`\<[`Node`](/docs/api/types/model/node/)\>

Input signal containing the original Node object for accessing node data, type, etc.

***

### nodeStyle

> **nodeStyle**: `InputSignal`\<`undefined` \| [`MinimapNodeStyle`](/docs/api/types/minimap/minimapnodestyle/)\>

Input signal for style overrides computed by nodeStyle callback. Can be ignored if not needed.
