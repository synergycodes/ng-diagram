import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  type Edge,
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramDefaultEdgeLabelComponent,
  type NgDiagramEdgeTemplate,
} from 'ng-diagram';

export interface LabelledEdgeData {
  label: string;
}

/** Custom edge template composing the public default label chip — the chip must look and behave the same as inside the default edge. */
@Component({
  selector: 'harness-labelled-edge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramDefaultEdgeLabelComponent],
  template: `
    <ng-diagram-base-edge [edge]="edge()">
      <ng-diagram-base-edge-label [id]="'edge-label'" [positionOnEdge]="0.5">
        <ng-diagram-default-edge-label>{{ label() }}</ng-diagram-default-edge-label>
      </ng-diagram-base-edge-label>
    </ng-diagram-base-edge>
  `,
})
export class LabelledEdgeComponent implements NgDiagramEdgeTemplate<LabelledEdgeData> {
  edge = input.required<Edge<LabelledEdgeData>>();

  readonly label = computed(() => this.edge().data?.label ?? '');
}
