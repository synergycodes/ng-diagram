import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';
import { EdgeTemplate } from '../../../types';
import { getPath } from '../../../utils/get-path/get-path';

@Component({
  selector: 'angular-adapter-default-edge',
  templateUrl: './default-edge.component.html',
  styleUrl: './default-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AngularAdapterEdgeLabelComponent],
})
export class DefaultEdgeComponent implements EdgeTemplate {
  data = input.required<Edge>();

  path = computed(() => {
    const { routing, points } = this.data();

    return getPath(routing, points || []);
  });

  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
