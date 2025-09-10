import { Component, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'labeled-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    stroke="var(--ngd-default-edge-stroke)"
  >
    <ng-diagram-base-edge-label [id]="'test-label'" [positionOnEdge]="0.5">
      <div class="custom-label">Label</div>
    </ng-diagram-base-edge-label>
  </ng-diagram-base-edge>`,
  styleUrl: './labeled-edge.component.scss',
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class LabeledEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
