/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { InputSignal, Type } from '@angular/core';
import { DataObject, GroupNode, Node, SimpleNode } from '../../core/src';

export interface NgDiagramNodeTemplate<
  Data extends DataObject = DataObject,
  NodeType extends Node<Data> = SimpleNode<Data>,
> {
  node: InputSignal<NodeType>;
}
export interface NgDiagramGroupNodeTemplate<Data extends DataObject = DataObject>
  extends NgDiagramNodeTemplate<Data, GroupNode<Data>> {}
export class NgDiagramNodeTemplateMap extends Map<
  string,
  Type<NgDiagramNodeTemplate<any>> | Type<NgDiagramGroupNodeTemplate<any>>
> {}
