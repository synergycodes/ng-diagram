import { NgDiagramMath } from '../../../math';
import { Point } from '../../../types';

/**
 * Computes a point along an orthogonal path at the given percentage of its total length.
 *
 * @remarks
 * - The path is treated as a series of connected line segments.
 * - The distance traveled along the path is measured, and then linear interpolation
 *   is applied within the segment that contains the target distance.
 * - If `points.length < 2`, returns `{x:0,y:0}`.
 * - The `percentage` is clamped to `[0,1]` using {@link NgDiagramMath.clamp}.
 *
 * @param points - Array of {@link Point} values defining the orthogonal path.
 * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end, 0.5 = halfway).
 * @returns The interpolated {@link Point} at the specified percentage along the path.
 *
 * @example
 * ```ts
 * // Multi-segment orthogonal path
 * const path = [{x:0,y:0},{x:10,y:0},{x:10,y:10}];
 * computeOrthogonalPointOnPath(path, 0.75);
 * // -> Point 75% of the way along total path length
 * ```
 */
export const computeOrthogonalPointOnPath = (points: Point[], percentage: number): Point => {
  // Handle edge cases
  if (points.length < 2) return { x: 0, y: 0 };

  // Clamp percentage to valid range [0, 1]
  const finalPercentage = NgDiagramMath.clamp({
    min: 0,
    value: percentage,
    max: 1,
  });

  // Calculate the length of each segment and total path length
  const lengths: number[] = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.hypot(dx, dy);
    lengths.push(length);
    totalLength += length;
  }

  // Calculate the target distance along the path
  const targetLength = totalLength * finalPercentage;
  let accumulated = 0;

  // Find which segment contains the target point
  for (let i = 0; i < lengths.length; i++) {
    const segmentLength = lengths[i];

    if (accumulated + segmentLength >= targetLength) {
      // Target point is within this segment
      const segmentStart = points[i];
      const segmentEnd = points[i + 1];
      const remaining = targetLength - accumulated;
      const segmentPercent = remaining / segmentLength;

      // Linearly interpolate within the segment
      const x = segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentPercent;
      const y = segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentPercent;

      return { x, y };
    }

    accumulated += segmentLength;
  }

  // If we reach here (shouldn't happen with clamped percentage), return the last point
  return points[points.length - 1];
};
