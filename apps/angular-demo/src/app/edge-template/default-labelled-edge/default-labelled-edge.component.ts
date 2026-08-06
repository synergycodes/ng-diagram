import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  Edge,
  NgDiagramBaseEdgeComponent,
  NgDiagramBaseEdgeLabelComponent,
  NgDiagramDefaultEdgeLabelComponent,
  NgDiagramEdgeTemplate,
} from 'ng-diagram';

/**
 * Custom edge that reuses the default label chip via NgDiagramDefaultEdgeLabelComponent
 * instead of copying its styles — theming and the selected-state border come for free.
 */
@Component({
  selector: 'app-default-labelled-edge',
  template: `
    <ng-diagram-base-edge [edge]="edge()" [targetArrowhead]="'ng-diagram-arrow'">
      <ng-diagram-base-edge-label [id]="'edge-label'" [positionOnEdge]="0.5">
        <ng-diagram-default-edge-label>{{ label() }}</ng-diagram-default-edge-label>
      </ng-diagram-base-edge-label>
    </ng-diagram-base-edge>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent, NgDiagramBaseEdgeLabelComponent, NgDiagramDefaultEdgeLabelComponent],
})
export class DefaultLabelledEdgeComponent implements NgDiagramEdgeTemplate<Data> {
  edge = input.required<Edge<Data>>();

  label = computed(() => this.edge().data?.label ?? 'Label');
}

interface Data {
  label?: string;
}
