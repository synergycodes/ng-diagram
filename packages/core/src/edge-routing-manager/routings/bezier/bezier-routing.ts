import { EdgeRoutingConfig, Point } from '../../../types';
import { EdgeRouting, EdgeRoutingContext } from '../../types';
import { computeBezierPath } from './compute-bezier-path';
import { computeBezierPointOnPath } from './compute-bezier-point-on-path';
import { computeBezierPoints } from './compute-bezier-points';

const CONTROL_POINT_OFFSET_FALLBACK = 100;

/**
 * Bezier curve routing implementation.
 *
 * @remarks
 * Produces a single cubic Bézier curve between source and target. Control points
 * are derived from the source/target positions and an offset distance which can
 * be customized via {@link EdgeRoutingConfiguration.bezier | config.bezier}.
 */
export class BezierRouting implements EdgeRouting {
  name = 'bezier';

  /**
   * Computes the control points for a cubic Bézier curve.
   *
   * @param context - The routing context. See {@link EdgeRoutingContext}.
   * @param [config] - Optional routing configuration. See {@link EdgeRoutingConfiguration}.
   * Uses `config.bezier.bezierControlOffset` when provided; defaults to `100`.
   * @returns An array of {@link Point} representing the Bézier points
   * (usually 4 points: start, control1, control2, end).
   *
   * @example
   * ```ts
   * const pts = routing.computePoints(ctx, { bezier: { bezierControlOffset: 80 } });
   * ```
   */
  computePoints(context: EdgeRoutingContext, config?: EdgeRoutingConfig): Point[] {
    const { sourcePoint, targetPoint } = context;
    const bezierControlOffset = config?.bezier?.bezierControlOffset ?? CONTROL_POINT_OFFSET_FALLBACK;

    return computeBezierPoints(sourcePoint, targetPoint, bezierControlOffset);
  }

  /**
   * Generates an SVG `d` path string for a cubic Bézier curve.
   *
   * @param points - The Bézier points produced by {@link BezierRouting.computePoints}.
   * @returns An SVG path string suitable for an `<path>` element's `d` attribute.
   *
   * @example
   * ```ts
   * const d = routing.computeSvgPath(points);
   * // e.g. "M x0,y0 C x1,y1 x2,y2 x3,y3"
   * ```
   */
  computeSvgPath(points: Point[]): string {
    return computeBezierPath(points);
  }

  /**
   * Gets a point on the Bézier curve at the given percentage.
   *
   * @param points - The Bézier points (start, control1, control2, end).
   * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end).
   * @returns The interpolated {@link Point} along the curve.
   *
   * @example
   * ```ts
   * const mid = routing.computePointOnPath(points, 0.5); // ~curve midpoint
   * ```
   */
  computePointOnPath(points: Point[], percentage: number): Point {
    return computeBezierPointOnPath(points, percentage);
  }
}
