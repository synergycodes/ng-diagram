import { Component, input } from '@angular/core';
import { NgDiagramBaseEdgeComponent, type Edge, type NgDiagramEdgeTemplate } from '@angularflow/angular-adapter';

@Component({
  selector: 'custom-edge',
  template: `<ng-diagram-base-edge [edge]="edge()" [pathAndPoints]="pathAndPoints()" [stroke]="'blue'" />`,
  imports: [NgDiagramBaseEdgeComponent],
})
export class CustomEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  // pathAndPoints = computed(() => ({
  //   path: this.generateCustomPath(),
  //   points: this.getControlPoints(),
  // }));

  // private generateCustomPath(): string {
  //   const { sourcePosition, targetPosition } = this.edge();

  //   // Custom path logic here
  //   return `M ${sourcePosition.x},${sourcePosition.y} L ${targetPosition.x},${targetPosition.y}`;
  // }
}
