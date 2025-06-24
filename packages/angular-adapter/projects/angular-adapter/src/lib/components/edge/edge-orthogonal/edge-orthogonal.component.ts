import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { IEdgeTemplate } from '../../../types';
import { getOrthogonalPath } from '../../../utils/get-paths';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';

@Component({
  selector: 'angular-adapter-edge-orthogonal',
  templateUrl: './edge-orthogonal.component.html',
  styleUrl: './edge-orthogonal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterEdgeLabelComponent],
})
export class EdgeOrthogonalComponent implements IEdgeTemplate {
  data = input.required<Edge>();

  path = computed(() => getOrthogonalPath(this.data().points || []));
  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
