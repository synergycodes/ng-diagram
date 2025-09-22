---
editUrl: false
next: false
prev: false
title: "NgDiagramConfig"
---

> **NgDiagramConfig** = `DeepPartial`\<[`FlowConfig`](/docs/api/types/flowconfig/)\>

`NgDiagramConfig` is the main configuration type for the ngDiagram library.
This configuration object allows you to override only the properties you need from the full [FlowConfig](/docs/api/types/flowconfig/).

This type is used as the type for the `config` input in [NgDiagramComponent](/docs/api/components/ngdiagramcomponent/)
and throughout the public API, such as in [NgDiagramService](/docs/api/services/ngdiagramservice/).

Example usage:
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
