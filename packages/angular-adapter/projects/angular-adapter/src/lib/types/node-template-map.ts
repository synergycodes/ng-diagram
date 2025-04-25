import { InputSignal, Type } from '@angular/core';
import { Node } from '@angularflow/core';

export interface INodeTemplate {
  data: InputSignal<Node>;
}

export type NodeTemplateMap = Map<string, Type<INodeTemplate>>;
