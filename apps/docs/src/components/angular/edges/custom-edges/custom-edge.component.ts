import { Component, computed, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'custom-edge',
  template: `<ng-diagram-base-edge
    [edge]="customEdge()"
    [stroke]="'var(--ngd-default-edge-stroke)'"
  />`,
  imports: [NgDiagramBaseEdgeComponent],
})
export class CustomEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  customEdge = computed(() => {
    const edge = this.edge();
    const { sourcePosition, targetPosition } = edge;

    if (!sourcePosition || !targetPosition) {
      return edge;
    }

    // Create custom points for the edge path
    const points = [
      { x: sourcePosition.x, y: sourcePosition.y },
      { x: targetPosition.x, y: targetPosition.y },
    ];

    return {
      ...edge,
      points,
      routing: 'polyline',
      routingMode: 'manual' as const,
    };
  });
}
