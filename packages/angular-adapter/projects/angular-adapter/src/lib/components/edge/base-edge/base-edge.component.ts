import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge, equalPointsArrays, Point, RoutingMode } from '@angularflow/core';
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
      const path = flowCore.edgeRoutingManager.computePath(routingName, points);
      return path;
    }

    // Use default routing if available
    const defaultRouting = flowCore.edgeRoutingManager.getDefaultRouting();
    if (flowCore.edgeRoutingManager.hasRouting(defaultRouting)) {
      return flowCore.edgeRoutingManager.computePath(defaultRouting, points);
    }

    // Fallback to simple straight line path
    return `M ${points[0].x},${points[0].y}`;
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
  private prevRoutingMode: RoutingMode | undefined;
  private prevPoints: Point[] | undefined;

  constructor() {
    // Sync edge properties from custom components back to the model
    effect(() => this.syncEdgePropertiesToModel());
  }

  private syncEdgePropertiesToModel(): void {
    const edge = this.edge();
    const edgeChanges: Partial<Edge> = {};

    const hasChanges =
      this.checkRoutingChanges(edge, edgeChanges) ||
      this.checkRoutingModeChanges(edge, edgeChanges) ||
      this.checkPointsChanges(edge, edgeChanges);

    // Emit update if any changes detected
    if (hasChanges) {
      this.flowCoreProvider.provide().commandHandler.emit('updateEdge', {
        id: edge.id,
        edgeChanges,
      });
    }
  }

  private checkRoutingChanges(edge: Edge, edgeChanges: Partial<Edge>): boolean {
    const routing = this.routing() ?? edge.routing;
    if (routing && this.prevRouting !== routing) {
      edgeChanges.routing = routing;
      this.prevRouting = routing;
      return true;
    }
    return false;
  }

  private checkRoutingModeChanges(edge: Edge, edgeChanges: Partial<Edge>): boolean {
    if (edge.routingMode && this.prevRoutingMode !== edge.routingMode) {
      edgeChanges.routingMode = edge.routingMode;
      this.prevRoutingMode = edge.routingMode;
      return true;
    }
    return false;
  }

  private checkPointsChanges(edge: Edge, edgeChanges: Partial<Edge>): boolean {
    if (edge.routingMode === 'manual' && edge.points && edge.points.length > 0) {
      // Update on initial render (when prevPoints is undefined) or when points changed
      if (!this.prevPoints || !equalPointsArrays(this.prevPoints, edge.points)) {
        edgeChanges.points = edge.points;
        this.prevPoints = edge.points;
        return true;
      }
    }
    return false;
  }
}
