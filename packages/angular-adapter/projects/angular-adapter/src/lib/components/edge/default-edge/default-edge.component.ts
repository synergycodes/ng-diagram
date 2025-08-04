import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { NgDiagramEdgeTemplate } from '../../../types';
import { getPath } from '../../../utils/get-path/get-path';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'ng-diagram-default-edge',
  templateUrl: './default-edge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent],
  styles: [
    `
      //TBD
      :host(:hover) ::ng-deep .ng-diagram-edge__path {
        stroke: var(--ngd-default-edge-stroke-hover);
      }
    `,
  ],
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  data = input.required<Edge>();

  path = computed(() => {
    const { routing, points } = this.data();
    return { path: getPath(routing, points || []), points: points || [] };
  });

  stroke = computed(() =>
    this.data().selected ? 'var(--ngd-default-edge-stroke-selected)' : 'var(--ngd-default-edge-stroke)'
  );
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : undefined));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : undefined));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
