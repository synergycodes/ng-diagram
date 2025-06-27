import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { AngularAdapterEdgeLabelComponent } from '../edge-label/angular-adapter-edge-label.component';
import { getOrthogonalPath } from '../../utils/get-orthogonal-paths';
import { getStraightPath } from '../../utils/get-paths';

@Component({
  selector: 'angular-adapter-edge',
  templateUrl: './angular-adapter-edge.component.html',
  styleUrl: './angular-adapter-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: PointerDownEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerEnterEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerLeaveEventListenerDirective, inputs: ['eventTarget'] },
    { directive: PointerUpEventListenerDirective, inputs: ['eventTarget'] },
    { directive: ZIndexDirective, inputs: ['data'] },
  ],
  imports: [AngularAdapterEdgeLabelComponent],
})
export class AngularAdapterEdgeComponent {
  data = input.required<Edge>();

  path = computed(() =>
    // this.data().routing === 'orthogonal'
    // Todo
    true
      ? getOrthogonalPath(this.data().points || [])
      : getStraightPath(this.data().points || [])
  );
  stroke = computed(() => (this.data().selected ? '#888' : '#bbb'));
  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));
}
