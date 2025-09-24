import { Point } from '../../../types';
import { EdgeRouting, EdgeRoutingContext } from '../../types';
import { computePolylinePointOnPath } from './compute-polyline-point-on-path';

/**
 * Polyline routing implementation.
 *
 * @remarks
 * Connects points with straight line segments. In **auto** mode it produces a
 * straight line between the source and target (two points). In **manual** mode
 * it respects user-provided waypoints found on {@link EdgeRoutingContext.edge | context.edge}
 * when {@link Edge.points | edge.points} contains more than two points.
 */
export class PolylineRouting implements EdgeRouting {
  name = 'polyline';

  /**
   * Computes the points for the polyline path.
   *
   * @param context - The routing context. See {@link EdgeRoutingContext}.
   * @returns An array of {@link Point} representing the polyline.
   *
   * @example
   * ```ts
   * const pts = routing.computePoints({ sourcePoint, targetPoint, edge, sourceNode, targetNode });
   * // -> [sourcePoint, targetPoint] in auto mode
   * ```
   */
  computePoints(context: EdgeRoutingContext): Point[] {
    const { sourcePoint, targetPoint, edge } = context;

    // If edge has manual points provided, use them
    if (edge.routingMode === 'manual' && edge.points && edge.points.length > 2) {
      return edge.points;
    }

    // Default to straight line
    return [
      { x: sourcePoint.x, y: sourcePoint.y },
      { x: targetPoint.x, y: targetPoint.y },
    ];
  }

  /**
   * Generates an SVG path string (`d` attribute) from polyline points.
   *
   * @param points - The points defining the polyline.
   * @returns An SVG path string. Returns an empty string when `points` is empty.
   *
   * @example
   * ```ts
   * const d = routing.computeSvgPath([{x:0,y:0},{x:10,y:0},{x:10,y:10}]);
   * // "M 0,0 L 10,0 L 10,10"
   * ```
   */
  computeSvgPath(points: Point[]): string {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

    const pathSegments = points.map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      return `L ${point.x},${point.y}`;
    });

    return pathSegments.join(' ');
  }

  /**
   * Gets a point on the polyline at the given percentage.
   *
   * @param points - The polyline points.
   * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end).
   * @returns The interpolated {@link Point} along the path.
   *
   * @example
   * ```ts
   * const p = routing.computePointOnPath(points, 0.5); // midpoint along total length
   * ```
   */
  computePointOnPath(points: Point[], percentage: number): Point {
    return computePolylinePointOnPath(points, percentage);
  }
}
