import { InputSignal, Type } from '@angular/core';
import { Edge } from '@angularflow/core';

export interface NgDiagramEdgeTemplate {
  data: InputSignal<Edge>;
}

export type NgDiagramEdgeTemplateMap = Map<string, Type<NgDiagramEdgeTemplate>>;
