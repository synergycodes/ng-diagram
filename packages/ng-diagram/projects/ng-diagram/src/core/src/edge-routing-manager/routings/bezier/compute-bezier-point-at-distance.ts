import { Point } from '../../../types';
import { normalizeDistance } from '../../utils/normalize-distance';
import { computeBezierPointOnPath } from './compute-bezier-point-on-path';

const NUM_SAMPLES = 100;

/**
 * Computes a point along a Bezier curve at a given pixel distance from the start,
 * using arc-length parameterization.
 *
 * @remarks
 * - Uses a lookup table of {@link NUM_SAMPLES} samples for arc-length approximation.
 * - Negative `distancePx` values measure from the end of the curve.
 * - The distance is clamped to `[0, totalArcLength]`.
 * - If `points.length < 2`, returns the first point if present, otherwise `{ x: 0, y: 0 }`.
 *
 * @param points - Array of {@link Point} values (start, control(s), end).
 * @param distancePx - Distance in pixels (positive = from start, negative = from end).
 * @returns The {@link Point} at the given distance along the curve.
 */
export const computeBezierPointAtDistance = (points: Point[], distancePx: number): Point => {
  if (points.length < 2) return points[0] || { x: 0, y: 0 };

  // 1. Build arc-length lookup table
  const samples: { t: number; length: number }[] = [{ t: 0, length: 0 }];
  let prevPoint = computeBezierPointOnPath(points, 0);
  let totalLength = 0;

  for (let i = 1; i <= NUM_SAMPLES; i++) {
    const t = i / NUM_SAMPLES;
    const currPoint = computeBezierPointOnPath(points, t);
    totalLength += Math.hypot(currPoint.x - prevPoint.x, currPoint.y - prevPoint.y);
    samples.push({ t, length: totalLength });
    prevPoint = currPoint;
  }

  // 2. Resolve negative distance (from target end)
  const targetLength = normalizeDistance(distancePx, totalLength);

  // 3. Find t for target distance via binary search
  let lo = 0;
  let hi = NUM_SAMPLES;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].length < targetLength) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  // 4. Interpolate t between surrounding samples
  const seg0 = samples[Math.max(0, lo - 1)];
  const seg1 = samples[lo];
  const segLength = seg1.length - seg0.length;
  const frac = segLength > 0 ? (targetLength - seg0.length) / segLength : 0;
  const t = seg0.t + (seg1.t - seg0.t) * frac;

  // 5. Evaluate bezier at interpolated t
  return computeBezierPointOnPath(points, t);
};
