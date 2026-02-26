import { Component, input } from '@angular/core';
import {
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

@Component({
  selector: 'routing-edge',
  template: `<ng-diagram-base-edge
    [edge]="edge()"
    stroke="var(--ngd-default-edge-stroke)"
  >
    <ng-diagram-base-edge-label id="routing-label" [positionOnEdge]="0.5">
      <div class="routing-label">
        {{ getRoutingName() }}
      </div>
    </ng-diagram-base-edge-label>
  </ng-diagram-base-edge>`,
  styleUrl: './routing-edge.component.scss',
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent],
})
export class RoutingEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  getRoutingName(): string {
    const routing = this.edge().routing || 'orthogonal';
    return routing.charAt(0).toUpperCase() + routing.slice(1);
  }
}
