import { InputSignal, Type } from '@angular/core';
import { Node } from '@angularflow/core';

export interface NodeTemplate {
  data: InputSignal<Node>;
}

export type NodeTemplateMap = Map<string, Type<NodeTemplate>>;
