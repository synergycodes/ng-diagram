import { ChangeDetectionStrategy, Component, computed, input, InputSignal } from '@angular/core';
import { Edge } from '@angularflow/core';
import { IEdgeTemplate } from '../../../types/edge-template-map';
import { getStraightPath } from '../../../utils/get-paths';

@Component({
  selector: 'angular-adapter-edge-straight',
  templateUrl: './edge-straight.component.html',
  styleUrl: './edge-straight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EdgeStraightComponent implements IEdgeTemplate {
  data: InputSignal<Edge> = input.required<Edge>();
  edge = input.required<Edge>();

  path = computed(() => getStraightPath(this.edge().points || []));
  stroke = computed(() => (this.edge().selected ? '#888' : '#bbb'));
  fill = computed(() => (this.edge().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.edge().sourceArrowhead ? `url(#${this.edge().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.edge().targetArrowhead ? `url(#${this.edge().targetArrowhead})` : null));
}
