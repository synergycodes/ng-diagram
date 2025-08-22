import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge } from '@angularflow/core';
import { EdgeSelectionDirective, ZIndexDirective } from '../../../directives';
import { FlowCoreProviderService } from '../../../services';

/**
 * Base edge component that handles edge rendering.
 *
 * Path can be determined in several ways (in order of priority):
 * 1. If edge has staticPath with svgPath - use that directly
 * 2. If routing prop is provided or edge has routing property - use RoutingManager to generate path
 * 3. Otherwise - middleware will calculate path based on default routing
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

    // Use static SVG path if provided
    if (edge.staticPath?.svgPath) {
      return edge.staticPath.svgPath;
    }

    // Generate SVG path from points using the routing
    const points = this.points();
    if (points.length === 0) return '';

    if (routingName && flowCore.routingManager.hasRouting(routingName)) {
      return flowCore.routingManager.computePath(routingName, points);
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
