import { Component, computed, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

const STROKE_WIDTH_DEFAULT = 2;
const STROKE_WIDTH_SELECTED = 4;

@Component({
  selector: 'labeled-edge',
  template: `<ng-diagram-base-edge
    [edge]="customEdge()"
    [stroke]="'orange'"
    [strokeWidth]="strokeWidth()"
  >
    <ng-diagram-base-edge-label [id]="'test-label'" [positionOnEdge]="0.5">
      <button
        style="white-space: nowrap; padding: 4px 8px;"
        (click)="onButtonClick()"
      >
        Click Me
      </button>
    </ng-diagram-base-edge-label>
  </ng-diagram-base-edge> `,
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class LabeledEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
  selected = computed(() => this.edge().selected);
  strokeWidth = computed(() =>
    this.selected() ? STROKE_WIDTH_SELECTED : STROKE_WIDTH_DEFAULT
  );

  onButtonClick() {
    const edge = this.edge();
    alert(`Edge ID: ${edge.id}`);
  }

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
