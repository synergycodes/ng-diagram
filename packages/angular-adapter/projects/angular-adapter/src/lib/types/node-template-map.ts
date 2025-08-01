import { InputSignal, Type } from '@angular/core';
import { GroupNode, Node, SimpleNode } from '@angularflow/core';

export interface NgDiagramNodeTemplate<NodeType extends Node = SimpleNode> {
  data: InputSignal<NodeType>;
}

export type NgDiagramNodeTemplateMap = Map<
  string,
  Type<NgDiagramNodeTemplate> | Type<NgDiagramNodeTemplate<GroupNode>>
>;
