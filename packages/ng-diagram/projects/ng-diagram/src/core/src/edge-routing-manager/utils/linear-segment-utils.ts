import { Point } from '../../types';

/**
 * Computes the length of each linear segment between consecutive points
 * and the total path length.
 *
 * @remarks
 * Used by segment-based routings (polyline, orthogonal). Not applicable to
 * curve-based routings (bezier) which use arc-length parameterization.
 *
 * @param points - Array of {@link Point} values defining the path.
 * @returns An object with `lengths` (per-segment) and `totalLength`.
 */
export const computeLinearSegmentLengths = (points: Point[]): { lengths: number[]; totalLength: number } => {
  const lengths: number[] = [];
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const length = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    lengths.push(length);
    totalLength += length;
  }
  return { lengths, totalLength };
};

/**
 * Walks linear segments to find the point at a given target length along the path.
 *
 * @remarks
 * Used by segment-based routings (polyline, orthogonal). Not applicable to
 * curve-based routings (bezier) which use binary search over arc-length samples.
 *
 * @param points - Array of {@link Point} values defining the path.
 * @param lengths - Per-segment lengths from {@link computeLinearSegmentLengths}.
 * @param targetLength - Absolute distance from the start (must be non-negative and ≤ total length).
 * @returns The interpolated {@link Point} on the path.
 */
export const interpolateAlongLinearSegments = (points: Point[], lengths: number[], targetLength: number): Point => {
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
