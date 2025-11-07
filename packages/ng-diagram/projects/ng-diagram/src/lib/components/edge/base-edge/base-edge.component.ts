import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { Edge, equalPointsArrays, Point, RoutingMode } from '../../../../core/src';
import { isValidPosition } from '../../../../core/src/utils/measurement-validation';
import { EdgeSelectionDirective, ZIndexDirective } from '../../../directives';
import { FlowCoreProviderService } from '../../../services';

const INVALID_EDGE_COORDINATES_ERROR = (
  edgeId: string,
  source: string,
  sourcePort: string | undefined,
  target: string,
  targetPort: string | undefined
) =>
  `[ngDiagram] Invalid edge coordinates detected for edge '${edgeId}'. This usually happens when sourcePort or targetPort is missing or doesn't exist on the node.

Edge details:
  • source: ${source} (port: ${sourcePort || 'not specified'})
  • target: ${target} (port: ${targetPort || 'not specified'})

To fix this:
  • Ensure sourcePort and targetPort are specified on the edge
  • Verify the ports exist in the source and target nodes

Documentation: https://www.ngdiagram.dev/docs/guides/edges/
`;

/**
 * Base edge component that handles edge rendering.
 * It can be extended or used directly to render edges in the diagram.
 * @category Components
 */
@Component({
  selector: 'ng-diagram-base-edge',
  standalone: true,
  templateUrl: './base-edge.component.html',
  styleUrl: './base-edge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: ZIndexDirective, inputs: ['data: edge'] },
    { directive: EdgeSelectionDirective, inputs: ['targetData: edge'] },
  ],
  host: {
    '[class.selected]': 'selected()',
    '[class.temporary]': 'temporary()',
  },
})
export class NgDiagramBaseEdgeComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);

  /**
   * Edge data model
   */
  edge = input.required<Edge>();

  /**
   * Edge routing mode
   */
  routing = input<string>();

  /**
   * Stroke color of the edge. Edge model data has precedence over this property.
   */
  stroke = input<string>();

  /**
   * ID of a source <marker> element in the SVG document. Edge model data has precedence over this property.
   */
  sourceArrowhead = input<string>();

  /**
   * ID of a target <marker> element in the SVG document. Edge model data has precedence over this property.
   */
  targetArrowhead = input<string>();

  /**
   * Stroke opacity of the edge
   */
  strokeOpacity = input<number>();

  /**
   * Stroke width of the edge
   */
  strokeWidth = input<number>();

  /**
   * Stroke dash array of the edge (e.g., '5 5' for dashed line, '10 5 2 5' for dash-dot pattern).
   */
  strokeDasharray = input<string>();

  readonly points = computed(() => this.edge().points ?? []);

  readonly path = computed(() => {
    const edge = this.edge();
    const routingName = this.routing() ?? edge.routing;
    const flowCore = this.flowCoreProvider.provide();

    // Generate SVG path from points using the routing
    const points = this.points();
    if (points.length === 0) return '';

    const hasInvalidPoints = points.some((p) => !isValidPosition(p));
    if (hasInvalidPoints) {
      console.error(
        INVALID_EDGE_COORDINATES_ERROR(edge.id, edge.source, edge.sourcePort, edge.target, edge.targetPort)
      );
      return '';
    }

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

  readonly markerStart = computed(() => {
    const markerId = this.edge()?.sourceArrowhead ?? this.sourceArrowhead();

    if (!markerId) {
      return null;
    }

    return `url(#${markerId})`;
  });

  readonly markerEnd = computed(() => {
    const markerId = this.edge()?.targetArrowhead ?? this.targetArrowhead();

    if (!markerId) {
      return null;
    }

    return `url(#${markerId})`;
  });

  readonly selected = computed(() => this.edge().selected);
  readonly temporary = computed(() => this.edge().temporary);

  readonly labels = computed(() => this.edge().measuredLabels ?? []);

  readonly class = computed(() => {
    const classArray = ['ng-diagram-edge__path'];

    if (this.selected()) {
      classArray.push('selected');
    }

    if (this.temporary()) {
      classArray.push('temporary');
    }

    return classArray.join(' ');
  });

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
