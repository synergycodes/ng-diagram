import { Component, input } from '@angular/core';
import {
  BaseEdgeLabelComponent,
  NgDiagramBaseEdgeComponent,
  type Edge,
  type NgDiagramEdgeTemplate,
} from '@angularflow/angular-adapter';

@Component({
  selector: 'routing-edge',
  template: `<ng-diagram-base-edge [edge]="edge()" stroke="var(--ngd-default-edge-stroke)">
    <ng-diagram-base-edge-label [id]="'routing-label'" [positionOnEdge]="0.5">
      <div class="routing-label">
        {{ getRoutingName() }}
      </div>
    </ng-diagram-base-edge-label>
  </ng-diagram-base-edge>`,
  styleUrl: './routing-edge.component.css',
  imports: [NgDiagramBaseEdgeComponent, BaseEdgeLabelComponent],
})
export class RoutingEdgeComponent implements NgDiagramEdgeTemplate {
  edge = input.required<Edge>();

  getRoutingName(): string {
    const routing = this.edge().routing || 'polyline';
    return routing.charAt(0).toUpperCase() + routing.slice(1);
  }
}