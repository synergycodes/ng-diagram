import { Point } from '../../../types';

/**
 * Generates an SVG path string from bezier control points.
 *
 * @param points - Array of points defining the bezier curve
 * @returns SVG path string
 */
export const computeBezierPath = (points: Point[] | null | undefined): string => {
  if (!points || points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x},${points[0].y}`;
  }

  if (points.length === 2) {
    // Two points - straight line
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  if (points.length === 3) {
    // Three points - quadratic bezier curve
    return `M ${points[0].x},${points[0].y} Q ${points[1].x},${points[1].y} ${points[2].x},${points[2].y}`;
  }

  if (points.length === 4) {
    // Four points - cubic bezier curve (most common case)
    return `M ${points[0].x},${points[0].y} C ${points[1].x},${points[1].y} ${points[2].x},${points[2].y} ${points[3].x},${points[3].y}`;
  }

  // More than 4 points - create just a polyline path passes through all points
  const path: string[] = [`M ${points[0].x},${points[0].y}`];

  for (let i = 1; i < points.length; i++) {
    path.push(`L ${points[i].x},${points[i].y}`);
  }

  return path.join(' ');
};
