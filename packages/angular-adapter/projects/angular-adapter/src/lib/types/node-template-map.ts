import { InputSignal, Type } from '@angular/core';
import { GroupNode, Node, SimpleNode } from '@angularflow/core';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NgDiagramNodeTemplate<TData = any, NodeType extends Node<TData> = SimpleNode<TData>> {
  node: InputSignal<NodeType>;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
export interface NgDiagramGroupNodeTemplate<TData = any> extends NgDiagramNodeTemplate<TData, GroupNode<TData>> {}
export type NgDiagramNodeTemplateMap = Map<string, Type<NgDiagramNodeTemplate> | Type<NgDiagramGroupNodeTemplate>>;
