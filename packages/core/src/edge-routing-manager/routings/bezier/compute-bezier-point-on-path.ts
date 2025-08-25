import { NgDiagramMath } from '../../../math';
import { Point } from '../../../types';

/**
 * Computes a point along a Bézier path at the given percentage.
 *
 * @remarks
 * - If `points.length < 2`, returns the first point if available, otherwise `{ x: 0, y: 0 }`.
 * - The parameter `percentage` is clamped to `[0, 1]` using {@link NgDiagramMath.clamp}.
 * - Supports:
 *   - **2 points** → linear interpolation.
 *   - **3 points** → quadratic Bézier curve:
 *     ```
 *     B(t) = (1 - t)²P₀ + 2(1 - t)tP₁ + t²P₂
 *     ```
 *   - **4 points** → cubic Bézier curve:
 *     ```
 *     B(t) = (1 - t)³P₀ + 3(1 - t)²tP₁ + 3(1 - t)t²P₂ + t³P₃
 *     ```
 * - For more than 4 points, only the first 4 are used (standard cubic Bézier).
 *
 * @param points - Array of {@link Point} values (start, control(s), end).
 * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end).
 * Values outside this range are clamped.
 * @returns The interpolated {@link Point} along the curve.
 *
 * @example
 * ```ts
 * // Cubic curve
 * computeBezierPointOnPath([
 *   {x:0,y:0}, {x:0,y:100}, {x:100,y:100}, {x:100,y:0}
 * ], 0.5);
 * // Midpoint along the cubic curve
 * ```
 */
export const computeBezierPointOnPath = (points: Point[], percentage: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };

  const t = NgDiagramMath.clamp({ min: 0, value: percentage, max: 1 });

  // Handle different cases based on number of points
  if (points.length === 2) {
    // Linear interpolation for 2 points
    const [p0, p1] = points;
    const x = p0.x + (p1.x - p0.x) * t;
    const y = p0.y + (p1.y - p0.y) * t;
    return { x, y };
  }

  if (points.length === 3) {
    // Quadratic Bézier curve formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    const [p0, p1, p2] = points;
    const oneMinusT = 1 - t;
    const oneMinusTSquared = oneMinusT * oneMinusT;
    const tSquared = t * t;

    const x = oneMinusTSquared * p0.x + 2 * oneMinusT * t * p1.x + tSquared * p2.x;
    const y = oneMinusTSquared * p0.y + 2 * oneMinusT * t * p1.y + tSquared * p2.y;
    return { x, y };
  }

  // Cubic Bézier curve formula: B(t) = (1-t)³P₀ + 3(1-t)²tP₁ + 3(1-t)t²P₂ + t³P₃
  const [p0, p1, p2, p3] = points;

  const oneMinusT = 1 - t;
  const oneMinusTSquared = oneMinusT * oneMinusT;
  const oneMinusTCubed = oneMinusTSquared * oneMinusT;
  const tSquared = t * t;
  const tCubed = tSquared * t;

  const x = oneMinusTCubed * p0.x + 3 * oneMinusTSquared * t * p1.x + 3 * oneMinusT * tSquared * p2.x + tCubed * p3.x;

  const y = oneMinusTCubed * p0.y + 3 * oneMinusTSquared * t * p1.y + 3 * oneMinusT * tSquared * p2.y + tCubed * p3.y;

  return { x, y };
};
