import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { IEdgeTemplate } from '../../../types';
import { getStraightPath } from '../../../utils/get-paths';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';
@Component({
  selector: 'angular-adapter-edge-straight',
  templateUrl: './edge-straight.component.html',
  styleUrl: './edge-straight.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterEdgeLabelComponent],
})
export class EdgeStraightComponent implements IEdgeTemplate {
  data = input.required<Edge>();

  path = computed(() => getStraightPath(this.data().points || []));
  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  fill = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
