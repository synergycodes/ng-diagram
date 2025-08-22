import { Point, PortLocation } from '../../../types';

/**
 * Calculates control point offset based on port side direction
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
 * Calculates the path points for bezier routing between two positions.
 *
 * @returns {Array} pathPoints - An array of path points for the bezier routing.
 * @param source - Source port location with position and side
 * @param target - Target port location with position and side
 * @param bezierControlOffset - Distance between the end points and their respective control points.
 * Higher values make the curve more "curved". Default is 100.
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
