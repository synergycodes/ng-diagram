---
editUrl: false
next: false
prev: false
title: "NgDiagramEdgeTemplate"
---

`NgDiagramEdgeTemplate` is an interface for custom edge components in ng-diagram.
It describes the required input signal for edge data and properties.

This interface is used when creating custom edge components to ensure they receive the correct edge input.

## Example usage
```typescript
@Component({...})
export class MyCustomEdgeComponent implements NgDiagramEdgeTemplate<MyEdgeData> {
  edge!: InputSignal<Edge<MyEdgeData>>;
}
```

## Type Parameters

### Data

`Data` *extends* `DataObject` = `DataObject`

The type of data associated with the edge

## Properties

### edge

> **edge**: `InputSignal`\<[`Edge`](/docs/api/types/model/edge/)\<`Data`\>\>

Input signal containing the edge data and properties.
