import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { EdgeSelectionDirective, ZIndexDirective } from '../../../directives';
import { FlowCoreProviderService } from '../../../services';

/**
 * Base edge component that handles edge rendering.
 *
 * Path is determined based on edge routing mode:
 * - Auto mode (default): Path is computed from source/target positions using routing algorithm
 * - Manual mode: Path is computed from user-provided points using routing algorithm
 * The routing algorithm determines how the path is rendered (orthogonal, bezier, polyline, etc.)
 */

@Component({
  selector: 'ng-diagram-base-edge',
  templateUrl: './base-edge.component.html',
  styleUrl: './base-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ZIndexDirective, inputs: ['data: edge'] },
    { directive: EdgeSelectionDirective, inputs: ['targetData: edge'] },
  ],
})
export class NgDiagramBaseEdgeComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  edge = input.required<Edge>();
  routing = input<string>();
  stroke = input<string>();
  customMarkerStart = input<string>();
  customMarkerEnd = input<string>();
  strokeOpacity = input<number>(1);
  strokeWidth = input<number>(2);

  points = computed(() => this.edge().points ?? []);

  path = computed(() => {
    const edge = this.edge();
    const routingName = this.routing() ?? edge.routing;
    const flowCore = this.flowCoreProvider.provide();

    // Generate SVG path from points using the routing
    const points = this.points();
    if (points.length === 0) return '';

    if (routingName && flowCore.edgeRoutingManager.hasRouting(routingName)) {
      return flowCore.edgeRoutingManager.computePath(routingName, points);
    }

    // Use default routing if available
    const defaultRouting = flowCore.edgeRoutingManager.getDefaultRouting();
    if (flowCore.edgeRoutingManager.hasRouting(defaultRouting)) {
      return flowCore.edgeRoutingManager.computePath(defaultRouting, points);
    }

    // Fallback to simple straight line path
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    const pathSegments = points.map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    });

    return pathSegments.join(' ');
  });

  markerStart = computed(() =>
    this.customMarkerStart()
      ? `url(#${this.customMarkerStart()})`
      : this.edge()?.targetArrowhead
        ? `url(#${this.edge().targetArrowhead})`
        : null
  );

  markerEnd = computed(() =>
    this.customMarkerEnd()
      ? `url(#${this.customMarkerEnd()})`
      : this.edge()?.sourceArrowhead
        ? `url(#${this.edge().sourceArrowhead})`
        : null
  );

  selected = computed(() => this.edge().selected);
  temporary = computed(() => this.edge().temporary);

  labels = computed(() => this.edge().labels ?? []);

  private prevRouting: string | undefined;

  constructor() {
    effect(() => {
      const routing = this.routing();
      if (!routing) return;

      // Update edge routing if component input changes
      if (this.prevRouting !== routing) {
        this.flowCoreProvider.provide().commandHandler.emit('updateEdge', {
          id: this.edge().id,
          edgeChanges: { routing },
        });
        this.prevRouting = routing;
      }
    });
  }
}
