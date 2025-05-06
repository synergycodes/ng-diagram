import { InputSignal, Type } from '@angular/core';
import { Edge } from '@angularflow/core';

export interface IEdgeTemplate {
  data: InputSignal<Edge>;
}

export type EdgeTemplateMap = Map<string, Type<IEdgeTemplate>>;
