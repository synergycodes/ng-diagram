import { EdgeRoutingConfig, Point } from '../../../types';
import { EdgeRouting, EdgeRoutingContext } from '../../types';
import { computeOrthogonalPath } from './compute-orthogonal-path';
import { computeOrthogonalPointAtDistance } from './compute-orthogonal-point-at-distance';
import { computeOrthogonalPointOnPath } from './compute-orthogonal-point-on-path';
import { computeOrthogonalPoints } from './compute-orthogonal-points';

/**
 * Orthogonal routing implementation.
 *
 * @remarks
 * Produces orthogonal segments. The first and last
 * segments can be lengthened/shortened via
 * {@link EdgeRoutingConfiguration.orthogonal | config.orthogonal}.
 * Rounded corners can be applied when generating the SVG path.
 */
export class OrthogonalRouting implements EdgeRouting {
  name = 'orthogonal';

  /**
   * Computes the orthogonal points between source and target.
   *
   * @param context - The routing context. See {@link EdgeRoutingContext}.
   * @param [config] - Optional routing configuration. Uses
   * `config.orthogonal.firstLastSegmentLength` when provided; defaults to `20`.
   * @returns An array of {@link Point} representing the orthogonal path.
   *
   * @example
   * ```ts
   * const pts = routing.computePoints(ctx, { orthogonal: { firstLastSegmentLength: 12 } });
   * ```
   */
  computePoints(context: EdgeRoutingContext, config?: EdgeRoutingConfig): Point[] {
    const { sourcePoint, targetPoint } = context;
    const configValue = config?.orthogonal?.firstLastSegmentLength;
    const firstLastSegmentLength = configValue != null && configValue >= 0 ? configValue : 20;

    // Now we have access to edge, nodes, and ports for more sophisticated routing
    // For now, we'll keep the same logic but could enhance it based on context
    return computeOrthogonalPoints(sourcePoint, targetPoint, firstLastSegmentLength);
  }

  /**
   * Generates an SVG `d` attribute for the orthogonal path.
   *
   * @param points - The orthogonal points.
   * @param [config] - Optional routing configuration. Uses
   * `config.orthogonal.maxCornerRadius` to round corners; defaults to `16`.
   * @returns An SVG path string suitable for an `<path>` element.
   *
   * @example
   * ```ts
   * const d = routing.computeSvgPath(points, { orthogonal: { maxCornerRadius: 8 } });
   * ```
   */
  computeSvgPath(points: Point[], config?: EdgeRoutingConfig): string {
    const configValue = config?.orthogonal?.maxCornerRadius;
    const maxCornerRadius = configValue != null && configValue >= 0 ? configValue : 16;
    return computeOrthogonalPath(points, maxCornerRadius);
  }

  /**
   * Gets a point on the orthogonal path at the given percentage.
   *
   * @param points - The orthogonal polyline points.
   * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end).
   * @returns The interpolated {@link Point} along the path.
   */
  computePointOnPath(points: Point[], percentage: number): Point {
    return computeOrthogonalPointOnPath(points, percentage);
  }

  /**
   * Gets a point on the orthogonal path at a given pixel distance from the start.
   *
   * @param points - The orthogonal polyline points.
   * @param distancePx - Distance in pixels (positive = from start, negative = from end).
   * @returns The {@link Point} at the given distance along the path.
   */
  computePointAtDistance(points: Point[], distancePx: number): Point {
    return computeOrthogonalPointAtDistance(points, distancePx);
  }
}
