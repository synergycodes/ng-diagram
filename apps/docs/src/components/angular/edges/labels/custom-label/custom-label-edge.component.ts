import { Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  selector: 'custom-label-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    stroke="var(--ngd-default-edge-stroke)"
  >
    <!-- @mark-start -->
    <ng-diagram-base-edge-label [id]="'custom-label'" [positionOnEdge]="0.5">
      <div class="custom-label">Custom Label</div>
    </ng-diagram-base-edge-label>
    <!-- @mark-end -->
  </ng-diagram-base-edge>`,
  styleUrl: './custom-label-edge.component.scss',
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class CustomLabelEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();
}
