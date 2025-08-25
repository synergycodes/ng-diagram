import { NgDiagramMath } from '../../../math';
import { Point } from '../../../types';

/**
 * Computes a point on a polyline path at a given percentage
 * @param points - Array of points defining the polyline path
 * @param percentage - Position along the path (0 = start, 1 = end)
 * @returns The point at the given percentage along the path
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
