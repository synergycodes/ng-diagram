import { Point } from '../../../types';

/**
 * Computes a point along an orthogonal path at a given pixel distance from the start.
 *
 * @remarks
 * - Negative `distancePx` values measure from the end of the path.
 * - The distance is clamped to `[0, totalLength]`.
 * - If `points.length < 2`, returns `{ x: 0, y: 0 }`.
 *
 * @param points - Array of {@link Point} values defining the orthogonal path.
 * @param distancePx - Distance in pixels (positive = from start, negative = from end).
 * @returns The {@link Point} at the given distance along the path.
 */
export const computeOrthogonalPointAtDistance = (points: Point[], distancePx: number): Point => {
  if (points.length < 2) return { x: 0, y: 0 };

  // Calculate segment lengths and total path length
  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const length = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    lengths.push(length);
    totalLength += length;
  }

  // Handle negative values (from target end)
  let targetLength = distancePx >= 0 ? distancePx : totalLength + distancePx;

  // Clamp to [0, totalLength]
  targetLength = Math.max(0, Math.min(targetLength, totalLength));

  // Walk segments to find the target point
  let accumulated = 0;
  for (let i = 0; i < lengths.length; i++) {
    if (accumulated + lengths[i] >= targetLength) {
      const remaining = targetLength - accumulated;
      const segmentPercent = lengths[i] > 0 ? remaining / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * segmentPercent,
        y: points[i].y + (points[i + 1].y - points[i].y) * segmentPercent,
      };
    }
    accumulated += lengths[i];
  }

  return points[points.length - 1];
};
