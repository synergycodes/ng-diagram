import { Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type NgDiagramEdgeTemplate,
  type Edge,
} from 'ng-diagram';
import { type TreeEdgeData } from '../types';

@Component({
  imports: [NgDiagramBaseEdgeComponent],
  template: `<ng-diagram-base-edge [edge]="edge()" />`,
  host: {
    '[style.visibility]': 'edge().data.isHidden ? "hidden" : null',
  },
})
export class EdgeComponent implements NgDiagramEdgeTemplate<TreeEdgeData> {
  edge = input.required<Edge<TreeEdgeData>>();
}
