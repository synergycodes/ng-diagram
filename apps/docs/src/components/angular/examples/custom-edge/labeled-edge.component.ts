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
    [edge]="edge()"
    [pathAndPoints]="pathAndPoints()"
    [stroke]="'aliceblue'"
    [strokeWidth]="strokeWidth()"
  >
    <ng-diagram-base-edge-label [id]="'test-label'" [positionOnEdge]="0.5">
      <button (mousedown)="onButtonClick()">Test</button>
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

  pathAndPoints() {
    const { sourcePosition, targetPosition } = this.edge();

    const path = `M ${sourcePosition?.x} ${sourcePosition?.y} L ${targetPosition?.x} ${targetPosition?.y}`;
    const points = [sourcePosition, targetPosition];

    return { path, points };
  }
}
