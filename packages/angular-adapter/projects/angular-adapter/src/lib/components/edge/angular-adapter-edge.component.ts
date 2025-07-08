import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Edge } from '@angularflow/core';
import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../directives';
import { getOrthogonalPath } from '../../utils/get-orthogonal-paths';
import { getStraightPath } from '../../utils/get-paths';
import { AngularAdapterEdgeLabelComponent } from '../edge-label/angular-adapter-edge-label.component';

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
  host: {
    '[class.hovered]': 'hovered()',
    '(pointerenter)': 'onHostPointerEnter()',
    '(pointerleave)': 'onHostPointerLeave()',
  },
})
export class AngularAdapterEdgeComponent {
  data = input.required<Edge>();

  private isHovered = signal(false);

  path = computed(() =>
    this.data().routing === 'orthogonal'
      ? getOrthogonalPath(this.data().points || [])
      : getStraightPath(this.data().points || [])
  );

  selected = computed(() => this.data().selected);
  hovered = computed(() => this.isHovered());

  markerStart = computed(() => (this.data().sourceArrowhead ? `url(#${this.data().sourceArrowhead})` : null));
  markerEnd = computed(() => (this.data().targetArrowhead ? `url(#${this.data().targetArrowhead})` : null));
  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));

  public setHovered(hovered: boolean) {
    this.isHovered.set(hovered);
  }

  onHostPointerEnter() {
    this.setHovered(true);
  }

  onHostPointerLeave() {
    this.setHovered(false);
  }
}
