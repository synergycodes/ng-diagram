import { NgDiagramMath } from '../../../math';
import { Point } from '../../../types';

/**
 * Computes a point along a polyline at a given percentage of its total length.
 *
 * @remarks
 * - If `points.length < 2`, returns the first point if present, otherwise `{ x: 0, y: 0 }`.
 * - The `percentage` is clamped to `[0, 1]` via {@link NgDiagramMath.clamp}.
 * - With exactly two points, this performs simple linear interpolation.
 * - With more than two points, it measures distance along each segment and
 *   interpolates within the segment that contains the target distance.
 *
 * @param points - Array of {@link Point} values defining the polyline path (in order).
 * @param percentage - Position along the path in `[0, 1]` (0 = start, 1 = end). Values
 * outside this range are clamped.
 * @returns The {@link Point} located at the given percentage along the path.
 *
 * @example
 * ```ts
 * // Straight line from (0,0) to (10,0)
 * computePolylinePointOnPath([{x:0,y:0},{x:10,y:0}], 0.5); // -> { x: 5, y: 0 }
 * ```
 *
 * @example
 * ```ts
 * // L-shaped path: (0,0) -> (10,0) -> (10,10)
 * // Total length = 20. At 25% (distance 5) we are at (5,0).
 * computePolylinePointOnPath([{x:0,y:0},{x:10,y:0},{x:10,y:10}], 0.25); // -> { x: 5, y: 0 }
 * ```
 */
export const computePolylinePointOnPath = (points: Point[], percentage: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };

  const clampedPercentage = NgDiagramMath.clamp({ min: 0, value: percentage, max: 1 });

  // For 2 points, use simple linear interpolation
  if (points.length === 2) {
    const startPoint = points[0];
    const endPoint = points[1];
    const x = startPoint.x + (endPoint.x - startPoint.x) * clampedPercentage;
    const y = startPoint.y + (endPoint.y - startPoint.y) * clampedPercentage;
    return { x, y };
  }

  // For multiple points, calculate position along the entire path
  // Calculate total path length
  let totalLength = 0;
  const segmentLengths: number[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    segmentLengths.push(length);
    totalLength += length;
  }

  // Find target distance along path
  const targetDistance = totalLength * clampedPercentage;

  // Find which segment contains the target point
  let accumulatedLength = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segmentLength = segmentLengths[i];

    if (accumulatedLength + segmentLength >= targetDistance) {
      // Target point is in this segment
      const segmentProgress = (targetDistance - accumulatedLength) / segmentLength;
      const startPoint = points[i];
      const endPoint = points[i + 1];

      return {
        x: startPoint.x + (endPoint.x - startPoint.x) * segmentProgress,
        y: startPoint.y + (endPoint.y - startPoint.y) * segmentProgress,
      };
    }

    accumulatedLength += segmentLength;
  }

  // Fallback to last point (shouldn't happen)
  return points[points.length - 1];
};
