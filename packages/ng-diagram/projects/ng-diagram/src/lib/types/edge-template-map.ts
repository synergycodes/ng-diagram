/* eslint-disable @typescript-eslint/no-explicit-any */

import { InputSignal, Type } from '@angular/core';
import { DataObject, Edge } from '@angularflow/core';

export interface NgDiagramEdgeTemplate<Data extends DataObject = DataObject> {
  edge: InputSignal<Edge<Data>>;
}

export class NgDiagramEdgeTemplateMap extends Map<string, Type<NgDiagramEdgeTemplate<any>>> {}
