/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { InputSignal, Type } from '@angular/core';
import { DataObject, GroupNode, Node, SimpleNode } from '../../core/src';

/**
 * Interface for custom node components.
 *
 * @public
 * @since 0.8.0
 * @template Data - The type of data associated with the node
 * @template NodeType - The type of node (SimpleNode or GroupNode)
 * @category Types/Templates
 */
export interface NgDiagramNodeTemplate<
  Data extends DataObject = DataObject,
  NodeType extends Node<Data> = SimpleNode<Data>,
> {
  /** Input signal containing the node data and properties. */
  node: InputSignal<NodeType>;
}

/**
 * Interface for custom group node components.
 *
 * @public
 * @since 0.8.0
 * @template Data - The type of data associated with the group node
 * @category Types/Templates
 */
export interface NgDiagramGroupNodeTemplate<Data extends DataObject = DataObject>
  extends NgDiagramNodeTemplate<Data, GroupNode<Data>> {}

/**
 * Map that associates node type names with their corresponding Angular component classes.
 * Used by ng-diagram to determine which custom node component to render based on node type.
 *
 * @public
 * @since 0.8.0
 * @category Types/Templates
 */
export class NgDiagramNodeTemplateMap extends Map<
  string,
  Type<NgDiagramNodeTemplate<any>> | Type<NgDiagramGroupNodeTemplate<any>>
> {}
