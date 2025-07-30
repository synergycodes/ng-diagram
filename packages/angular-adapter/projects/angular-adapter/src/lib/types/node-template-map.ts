import { InputSignal, Type } from '@angular/core';
import { GroupNode, Node, SimpleNode } from '@angularflow/core';

export interface NodeTemplate<NodeType extends Node = SimpleNode> {
  data: InputSignal<NodeType>;
  isPaletteNode: InputSignal<boolean>;
}

export type NodeTemplateMap = Map<string, Type<NodeTemplate> | Type<NodeTemplate<GroupNode>>>;
