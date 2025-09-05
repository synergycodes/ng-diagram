import { InputSignal, Type } from '@angular/core';
import { Edge } from '@angularflow/core';

export interface NgDiagramEdgeTemplate {
  edge: InputSignal<Edge>;
}

export class NgDiagramEdgeTemplateMap extends Map<string, Type<NgDiagramEdgeTemplate>> {}
