import { Point, PortLocation } from '../../../types';

/**
 * Calculates a control point offset from a given port position.
 *
 * @remarks
 * The offset direction is determined by {@link PortLocation.side}:
 * - `"right"` → control point to the right of the port.
 * - `"left"` → control point to the left of the port.
 * - `"bottom"` → control point below the port.
 * - `"top"` → control point above the port.
 * - Other values fall back to `"right"`.
 *
 * @param position - The port location with x/y coordinates and side.
 * @param offset - Distance to offset from the port in the direction of its side.
 * @returns A new {@link Point} representing the control point.
 */
const getControlPointOffset = (position: PortLocation, offset: number): Point => {
  switch (position.side) {
    case 'right':
      return { x: position.x + offset, y: position.y };
    case 'left':
      return { x: position.x - offset, y: position.y };
    case 'bottom':
      return { x: position.x, y: position.y + offset };
    case 'top':
      return { x: position.x, y: position.y - offset };
    default:
      // Fallback for undefined side - use horizontal right direction
      return { x: position.x + offset, y: position.y };
  }
};

/**
 * Calculates the four points required for a cubic Bézier curve between two ports.
 *
 * @remarks
 * The result contains:
 * - Start point (`source`)
 * - Control point near source (offset in direction of {@link PortLocation.side})
 * - Control point near target (offset in direction of {@link PortLocation.side})
 * - End point (`target`)
 *
 * These points can be passed to {@link computeBezierPath} to generate
 * the SVG `d` path string, or to {@link computeBezierPointOnPath}
 * for sampling along the curve.
 *
 * @param source - Source port location with position and side.
 * @param target - Target port location with position and side.
 * @param [bezierControlOffset=100] - Distance between the endpoints and their respective control points.
 * Higher values produce more pronounced curves.
 * @returns An array of four {@link Point} values `[start, c1, c2, end]`.
 *
 * @example
 * ```ts
 * const points = computeBezierPoints(
 *   { x: 0, y: 0, side: 'right' },
 *   { x: 200, y: 0, side: 'left' },
 *   80
 * );
 * // -> [{x:0,y:0}, {x:80,y:0}, {x:120,y:0}, {x:200,y:0}]
 * ```
 */
export const computeBezierPoints = (source: PortLocation, target: PortLocation, bezierControlOffset = 100): Point[] => {
  if (!source || !target) return [];

  // Calculate control points based on port sides
  const sourceControlPoint = getControlPointOffset(source, Math.abs(bezierControlOffset));
  const targetControlPoint = getControlPointOffset(target, Math.abs(bezierControlOffset));

  const sourcePoint = {
    x: source.x,
    y: source.y,
  };
  const targetPoint = {
    x: target.x,
    y: target.y,
  };

  return [sourcePoint, sourceControlPoint, targetControlPoint, targetPoint];
};
