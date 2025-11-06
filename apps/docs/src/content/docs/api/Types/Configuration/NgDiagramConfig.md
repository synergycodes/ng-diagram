---
editUrl: false
next: false
prev: false
title: "NgDiagramConfig"
---

> **NgDiagramConfig** = `DeepPartial`\<[`FlowConfig`](/docs/api/types/configuration/flowconfig/)\>

The recommended configuration type for ng-diagram.

This type allows you to provide only the configuration options you want to override.
All properties are optional and correspond to those in [FlowConfig](/docs/api/types/configuration/flowconfig/).

## See

 - [FlowConfig](/docs/api/types/configuration/flowconfig/) – for the full list of available configuration options
 - [NgDiagramComponent](/docs/api/components/ngdiagramcomponent/)
 - [NgDiagramService](/docs/api/services/ngdiagramservice/)

## Examples

```ts
// define configuration in a component
const config: NgDiagramConfig = {
  zoom: { max: 3 },
  edgeRouting: { defaultRouting: 'orthogonal' },
};
```

```html
<!-- use configuration in your template with ngDiagram -->
<ng-diagram [config]="config"></ng-diagram>
```
