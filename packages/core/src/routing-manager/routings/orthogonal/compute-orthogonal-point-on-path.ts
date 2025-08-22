import { NgDiagramMath } from '../../../math';
import { Point } from '../../../types';

/**
 * Calculates a point on an orthogonal path at a given percentage along its length.
 * The path is treated as a series of connected line segments, and the point
 * is calculated by linear interpolation along the total path length.
 *
 * @param points - Array of points defining the orthogonal path
 * @param percentage - Position along the path (0 = start, 1 = end, 0.5 = middle)
 * @returns The point at the specified percentage along the path
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

  // Step 1: Calculate the length of each segment and total path length
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

  // Step 2: Find which segment contains the target point
  for (let i = 0; i < lengths.length; i++) {
    const segmentLength = lengths[i];

    if (accumulated + segmentLength >= targetLength) {
      // Target point is within this segment
      const segmentStart = points[i];
      const segmentEnd = points[i + 1];
      const remaining = targetLength - accumulated;
      const segmentPercent = remaining / segmentLength;

      // Step 3: Linearly interpolate within the segment
      const x = segmentStart.x + (segmentEnd.x - segmentStart.x) * segmentPercent;
      const y = segmentStart.y + (segmentEnd.y - segmentStart.y) * segmentPercent;

      return { x, y };
    }

    accumulated += segmentLength;
  }

  // If we reach here (shouldn't happen with clamped percentage), return the last point
  return points[points.length - 1];
};
