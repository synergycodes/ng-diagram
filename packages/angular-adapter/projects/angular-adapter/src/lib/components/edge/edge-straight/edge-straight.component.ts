import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
  data = input.required<Edge>();
  isTemporary = input<boolean>();

  path = computed(() => getStraightPath(this.data().points || []));
  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  fill = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.isTemporary() ? 0.5 : 1));
}
