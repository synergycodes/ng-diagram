import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge, equalPointsArrays, Point, Routing } from '@angularflow/core';
import { ZIndexDirective } from '../../../directives';
import { FlowCoreProviderService } from '../../../services';
import { getBezierPath } from '../../../utils/get-paths/get-bezier-paths';
import { getOrthogonalPath } from '../../../utils/get-paths/get-orthogonal-paths';
import { getStraightPath } from '../../../utils/get-paths/get-straight-paths';
import { AngularAdapterEdgeLabelComponent } from '../../edge-label/angular-adapter-edge-label.component';

/**
 * To create an edge with a custom path, you must provide the `pathAndPoints` property.
 * If you want to use one of the default edge types, set the `routing` property in `edge`
 * or provide the `routing` property as a component prop
 *
 * - For custom paths:
 *  - Provide the `pathAndPoints` prop to the component with your custom `path` string and `points` array.
 *
 * - For default paths:
 *   - Set `routing` in `edge` to one of the supported types (e.g., `'straight'`, `'bezier'`, `'orthogonal'`).
 *   - Or provide the `routing` property as a component prop
 *   - The edge will automatically generate its path based on the routing type and provided points.
 *
 */

@Component({
  selector: 'angular-adapter-custom-edge',
  templateUrl: './custom-edge.component.html',
  styleUrl: './custom-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [{ directive: ZIndexDirective, inputs: ['data'] }],
  imports: [AngularAdapterEdgeLabelComponent],
})
export class AngularAdapterCustomEdgeComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  data = input.required<Edge>();
  pathAndPoints = input<{ path: string; points: Point[] }>();
  routing = input<Routing>();
  customStroke = input<string>();
  customMarkerStart = input<string>();
  customMarkerEnd = input<string>();
  displayLabel = input<boolean>();

  points = computed(() => (this.routing() ? this.data().points : (this.pathAndPoints()?.points ?? [])));

  path = computed(() => {
    const routing = this.routing();
    if (!routing) return this.pathAndPoints()?.path ?? '';

    const points = this.points() || [];
    return routing === 'orthogonal'
      ? getOrthogonalPath(points)
      : routing === 'bezier'
        ? getBezierPath(points)
        : getStraightPath(points);
  });

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

  private prevRouting: string | undefined;
  private prevPoints: Point[] | undefined;

  constructor() {
    effect(() => {
      const { sourcePosition, targetPosition } = this.data();

      const routing = this.routing?.();
      if (!routing || !sourcePosition || !targetPosition) return;

      if (this.prevRouting !== routing) {
        this.flowCoreProvider.provide().commandHandler.emit('updateEdge', {
          id: this.data().id,
          edgeChanges: { routing },
        });
        this.prevRouting = routing;
      }
    });

    effect(() => {
      if (!this.pathAndPoints() || this.routing()) return;

      const currentPoints = this.points() || [];
      if (this.prevPoints && !equalPointsArrays(this.prevPoints, currentPoints)) {
        this.flowCoreProvider.provide().commandHandler.emit('updateEdge', {
          id: this.data().id,
          edgeChanges: { points: currentPoints },
        });
      }
      this.prevPoints = currentPoints;
    });
  }
}
