import { InputSignal, Type } from '@angular/core';
import { DataObject, Edge } from '../../core/src';

/**
 * `NgDiagramEdgeTemplate` is an interface for custom edge components in ng-diagram.
 * It describes the required input signal for edge data and properties.
 *
 * This interface is used when creating custom edge components to ensure they receive the correct edge input.
 *
 * ## Example usage
 * ```typescript
 * @Component({...})
 * export class MyCustomEdgeComponent implements NgDiagramEdgeTemplate<MyEdgeData> {
 *   edge!: InputSignal<Edge<MyEdgeData>>;
 * }
 * ```
 * @template Data - The type of data associated with the edge
 * @category Types
 */
export interface NgDiagramEdgeTemplate<Data extends DataObject = DataObject> {
  /** Input signal containing the edge data and properties. */
  edge: InputSignal<Edge<Data>>;
}

/**
 * `NgDiagramEdgeTemplateMap` is a map that associates edge type names with their corresponding Angular component classes.
 *
 * ## Example usage
 * ```typescript
 * // Define a map of edge types to their components
 * const edgeTemplateMap = new NgDiagramEdgeTemplateMap([['someEdge', SomeEdgeComponent]]);
 * ```
 *
 * ```html
 *  <!-- use the edge template map in your diagram component -->
 *  <ng-diagram [edgeTemplateMap]="edgeTemplateMap" />
 * ```
 * @category Types
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class NgDiagramEdgeTemplateMap extends Map<string, Type<NgDiagramEdgeTemplate<any>>> {}
