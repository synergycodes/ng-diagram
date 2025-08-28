import { Point } from '../../../types';

/**
 * Generates an SVG path string from Bézier control points.
 *
 * @remarks
 * The output string is intended for the `d` attribute of an `<path>` SVG element.
 * Behavior varies depending on the number of points:
 *
 * - `0` points → returns an empty string (`""`).
 * - `1` point → move command only (`M`).
 * - `2` points → straight line (`M … L …`).
 * - `3` points → quadratic Bézier curve (`M … Q … …`).
 * - `4` points → cubic Bézier curve (`M … C … … …`).
 * - `>4` points → polyline path using straight `L` segments through all points.
 *
 * @param points - Array of {@link Point} values defining the curve (start, control(s), end).
 * Can be `null` or `undefined`, in which case an empty string is returned.
 * @returns An SVG path string.
 *
 * @example
 * ```ts
 * // Cubic Bézier curve
 * computeBezierPath([
 *   {x:0, y:0}, {x:50, y:100}, {x:150, y:100}, {x:200, y:0}
 * ]);
 * // "M 0,0 C 50,100 150,100 200,0"
 * ```
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
