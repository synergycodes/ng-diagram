import { Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  template: `<ng-diagram-base-edge [edge]="edge()" />`,
  imports: [NgDiagramBaseEdgeComponent],
  styleUrls: ['./custom-edge.component.scss'],
})
export class CustomEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
