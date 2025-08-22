import { Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'custom-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    [pathAndPoints]="pathAndPoints()"
    [stroke]="'aliceblue'"
  />`,
  imports: [NgDiagramBaseEdgeComponent],
})
export class CustomEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  pathAndPoints() {
    const { sourcePosition, targetPosition } = this.edge();

    const path = `M ${sourcePosition?.x} ${sourcePosition?.y} L ${targetPosition?.x} ${targetPosition?.y}`;
    const points = [sourcePosition, targetPosition];

    return { path, points };
  }
}
