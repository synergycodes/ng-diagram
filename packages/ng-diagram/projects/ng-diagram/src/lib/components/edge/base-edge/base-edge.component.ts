import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import {
  Edge,
  EdgeEnd,
  equalPointsArrays,
  isDanglingEdge,
  isEdgeEndRelinkable,
  Point,
  RoutingMode,
} from '../../../../core/src';
import { isValidPosition } from '../../../../core/src/utils/measurement-validation';
import { EdgeSelectionDirective, InlineMarkersDirective, ZIndexDirective } from '../../../directives';
import { RelinkHandleDirective } from '../../../directives/input-events/relinking/relinking.directive';
import { FlowCoreProviderService } from '../../../services';
import { MarkerRegistryService } from '../../../services/marker-registry/marker-registry.service';
import { RendererService } from '../../../services/renderer/renderer.service';
import { NgDiagramService } from '../../../public-services/ng-diagram.service';

const INVALID_EDGE_COORDINATES_ERROR = (
  edgeId: string,
  source: string,
  sourcePort: string | undefined,
  target: string,
  targetPort: string | undefined
) =>
  `[ngDiagram] Invalid edge coordinates detected for edge '${edgeId}'.

Edge details:
  • source: ${source} (port: ${sourcePort || 'not specified'})
  • target: ${target} (port: ${targetPort || 'not specified'})

Documentation: https://www.ngdiagram.dev/docs/guides/edges/edges/
`;

/** Screen-pixel radius of the relink handles' invisible hit area. */
const RELINK_HANDLE_HIT_RADIUS_PX = 12;

/**
 * Base edge component that handles edge rendering.
 * It can be extended or used directly to render edges in the diagram.
 *
 * @public
 * @since 0.8.0
 * @category Components
 */
@Component({
  selector: 'ng-diagram-base-edge',
  standalone: true,
  imports: [InlineMarkersDirective, RelinkHandleDirective],
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
    '[class.dangling]': 'dangling()',
  },
})
export class NgDiagramBaseEdgeComponent {
  private readonly flowCoreProvider = inject(FlowCoreProviderService);
  private readonly markerRegistry = inject(MarkerRegistryService);
  // Optional so consumer TestBeds that mount the component without
  // provideNgDiagram() keep working — without it the relink handles stay off.
  private readonly diagramService = inject(NgDiagramService, { optional: true });
  private readonly renderer = inject(RendererService, { optional: true });

  /**
   * Whether to use inline markers (Safari fallback).
   * Safari doesn't support context-stroke, so we render markers inline per edge.
   */
  readonly useInlineMarkers = this.markerRegistry.useInlineMarkers;

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

  readonly sourceMarkerId = computed(() => this.edge()?.sourceArrowhead ?? this.sourceArrowhead());

  readonly targetMarkerId = computed(() => this.edge()?.targetArrowhead ?? this.targetArrowhead());

  readonly markerStart = computed(() => {
    const markerId = this.sourceMarkerId();
    if (!markerId) {
      return null;
    }
    return this.markerRegistry.getMarkerUrl(markerId, this.edge().id, 'source');
  });

  readonly markerEnd = computed(() => {
    const markerId = this.targetMarkerId();
    if (!markerId) {
      return null;
    }
    return this.markerRegistry.getMarkerUrl(markerId, this.edge().id, 'target');
  });

  readonly selected = computed(() => this.edge().selected);
  readonly temporary = computed(() => this.edge().temporary);

  /**
   * Whether the edge has at least one free (unconnected) endpoint. Temporary
   * edges are excluded: a draw preview always has a free end, but it must not
   * get the dangling styling.
   */
  readonly dangling = computed(() => {
    const edge = this.edge();
    return isDanglingEdge(edge) && !edge.temporary;
  });

  readonly labels = computed(() => this.edge().measuredLabels ?? []);

  /**
   * Whether the source endpoint handle is rendered. It is rendered when the
   * edge is selected, is not a temporary edge, has routed points, and its
   * source end can be relinked.
   *
   * @since 1.4.0
   */
  readonly relinkSourceHandleVisible = computed(() => this.relinkHandleVisible('source'));

  /**
   * Same as {@link relinkSourceHandleVisible} for the target end.
   *
   * @since 1.4.0
   */
  readonly relinkTargetHandleVisible = computed(() => this.relinkHandleVisible('target'));

  /**
   * Position of the source endpoint handle (the first routed point).
   *
   * @since 1.4.0
   */
  readonly relinkSourceHandle = computed(() => this.points()[0]);

  /**
   * Position of the target endpoint handle (the last routed point).
   *
   * @since 1.4.0
   */
  readonly relinkTargetHandle = computed(() => this.points()[this.points().length - 1]);

  /**
   * Radius of the invisible hit circle around each handle, in flow units. The
   * radius is divided by the viewport scale, so the hit area keeps a constant,
   * finger-friendly size on screen at any zoom level. Without this, at zoom
   * 0.5 the visible 5px circle would give only a 2.5px touch target.
   *
   * @since 1.4.0
   */
  readonly relinkHandleHitRadius = computed(() => {
    const scale = this.renderer?.viewport().scale || 1;
    return RELINK_HANDLE_HIT_RADIUS_PX / scale;
  });

  readonly class = computed(() => {
    const classArray = ['ng-diagram-edge__path'];

    if (this.selected()) {
      classArray.push('selected');
    }

    if (this.temporary()) {
      classArray.push('temporary');
    }

    if (this.dangling()) {
      classArray.push('dangling');
    }

    return classArray.join(' ');
  });

  private prevRouting: string | undefined;
  private prevRoutingMode: RoutingMode | undefined;
  private prevPoints: Point[] | undefined;

  private relinkHandleVisible(end: EdgeEnd): boolean {
    if (!this.selected() || this.temporary() || this.points().length === 0) {
      return false;
    }
    const defaultRelinkable = this.diagramService?.config().linking?.defaultRelinkable ?? false;
    return isEdgeEndRelinkable(this.edge(), end, defaultRelinkable);
  }

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
