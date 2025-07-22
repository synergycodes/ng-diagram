import { InputSignal, Type } from '@angular/core';
import { Edge } from '@angularflow/core';

export interface EdgeTemplate {
  data: InputSignal<Edge>;
}

export type EdgeTemplateMap = Map<string, Type<EdgeTemplate>>;
