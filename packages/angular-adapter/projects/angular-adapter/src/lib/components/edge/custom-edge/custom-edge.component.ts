import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge, equalPointsArrays, Point } from '@angularflow/core';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';
import {
  PointerDownEventListenerDirective,
  PointerEnterEventListenerDirective,
  PointerLeaveEventListenerDirective,
  PointerUpEventListenerDirective,
  ZIndexDirective,
} from '../../../directives';
import { FlowCoreProviderService } from '../../../services';

@Component({
  selector: 'angular-adapter-custom-edge',
  templateUrl: './custom-edge.component.html',
  styleUrl: './custom-edge.component.scss',
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
export class AngularAdapterCustomEdgeComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  data = input.required<Edge>();
  path = input.required<string>();
  points = input.required<Point[]>();
  customStroke = input<string>();
  customMarkerStart = input<string>();
  customMarkerEnd = input<string>();
  displayLabel = input<boolean>();

  stroke = computed(() => {
    if (this.customStroke()) return this.customStroke();
    return this.data().selected ? '#888' : '#bbb';
  });

  markerStart = computed(() =>
    this.customMarkerStart()
      ? `url(#${this.customMarkerStart()})`
      : this.data()?.targetArrowhead
        ? `url(#${this.data().targetArrowhead})`
        : null
  );

  markerEnd = computed(() =>
    this.customMarkerEnd()
      ? `url(#${this.customMarkerEnd()})`
      : this.data()?.sourceArrowhead
        ? `url(#${this.data().sourceArrowhead})`
        : null
  );

  strokeOpacity = computed(() => (this.data().temporary ? 0.5 : 1));

  private prevPoints: Point[] | undefined;

  constructor() {
    effect(() => {
      const currentPoints = this.points();
      const prevPoints = this.prevPoints;
      if (prevPoints !== undefined && !equalPointsArrays(prevPoints, currentPoints)) {
        this.flowCoreProvider.provide().commandHandler.emit('updateEdge', {
          id: this.data().id,
          edgeChanges: {
            points: currentPoints,
          },
        });
      }

      this.prevPoints = currentPoints;
    });
  }
}
