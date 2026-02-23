import { Point } from '../../../types';
import { computeLinearSegmentLengths, interpolateAlongLinearSegments } from '../../utils/linear-segment-utils';
import { normalizeDistance } from '../../utils/normalize-distance';

/**
 * Computes a point along an orthogonal path at a given pixel distance from the start.
 *
 * @remarks
 * - Negative `distancePx` values measure from the end of the path.
 * - The distance is clamped to `[0, totalLength]`.
 * - If `points.length < 2`, returns the first point if present, otherwise `{ x: 0, y: 0 }`.
 *
 * @param points - Array of {@link Point} values defining the orthogonal path.
 * @param distancePx - Distance in pixels (positive = from start, negative = from end).
 * @returns The {@link Point} at the given distance along the path.
 */
export const computeOrthogonalPointAtDistance = (points: Point[], distancePx: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };

  const { lengths, totalLength } = computeLinearSegmentLengths(points);
  const targetLength = normalizeDistance(distancePx, totalLength);

  return interpolateAlongLinearSegments(points, lengths, targetLength);
};
