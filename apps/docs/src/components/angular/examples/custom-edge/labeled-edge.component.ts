import { Component, computed, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

const STROKE_WIDTH_DEFAULT = 2;
const STROKE_WIDTH_SELECTED = 4;

@Component({
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    stroke="var(--ngd-labeled-edge-stroke)"
    [strokeWidth]="strokeWidth()"
  >
    <ng-diagram-base-edge-label id="test-label" [positionOnEdge]="0.5">
      <button
        style="white-space: nowrap; padding: 4px 8px; background: var(--ngd-node-bg-primary-default); border: none;"
        (click)="onButtonClick()"
      >
        Click Me
      </button>
    </ng-diagram-base-edge-label>
  </ng-diagram-base-edge> `,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
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
}
