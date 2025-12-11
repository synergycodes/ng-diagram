---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "provideNgDiagram"
---

> **provideNgDiagram**(): `Provider`[]

Provides all the services required for ng-diagram to function.

## Returns

`Provider`[]

Array of providers for all ng-diagram services

## Example

```typescript
@Component({
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram()],
  template: `<ng-diagram [model]="model" />`
})
export class Diagram {
  model = initializeModel({
    nodes: [
      {
        id: '1',
        position: { x: 0, y: 0 },
        data: { label: 'Node 1' }
      }
    ]
  });
}
```
