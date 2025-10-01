import { Component, input, ViewEncapsulation } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    stroke="var(--ngd-default-edge-stroke)"
  />`,
  imports: [NgDiagramBaseEdgeComponent],
  encapsulation: ViewEncapsulation.None, //remember to set ViewEncapsulation to None to apply styles
  styleUrls: ['./custom-edge.component.scss'],
})
export class CustomEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
