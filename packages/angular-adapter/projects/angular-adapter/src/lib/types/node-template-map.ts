import { InputSignal, Type } from '@angular/core';
import { Node } from '@angularflow/core';

export interface NodeTemplate {
  data: InputSignal<Node>;
  isPaletteNode: InputSignal<boolean>;
}

export type NodeTemplateMap = Map<string, Type<NodeTemplate>>;
