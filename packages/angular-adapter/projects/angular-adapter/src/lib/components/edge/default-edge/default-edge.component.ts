import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { NgDiagramEdgeTemplate } from '../../../types';
import { getPath } from '../../../utils/get-path/get-path';
import { NgDiagramBaseEdgeComponent } from '../base-edge/base-edge.component';

@Component({
  selector: 'angular-adapter-default-edge',
  templateUrl: './default-edge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgDiagramBaseEdgeComponent],
})
export class NgDiagramDefaultEdgeComponent implements NgDiagramEdgeTemplate {
  data = input.required<Edge>();

  path = computed(() => {
    const { routing, points } = this.data();
    return { path: getPath(routing, points || []), points: points || [] };
  });

  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : undefined));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : undefined));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
