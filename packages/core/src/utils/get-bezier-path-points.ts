import { Point, PortLocation } from '../types';

/**
 * Calculates the path points for bezier routing between two positions.
 *
 *
 * @returns {Array} pathPoints - An array of path points for the orthogonal routing.
 * @param source
 * @param target
 * @param bezierControlOffset distance between the end points and their respective control points
 * Higher values make the curve more "curved". Default is 100.
 */
export const getBezierPathPoints = (source: PortLocation, target: PortLocation, bezierControlOffset = 100): Point[] => {
  if (!source || !target) return [];

  const point1 = { x: source.x + bezierControlOffset, y: source.y };
  const point2 = { x: target.x - bezierControlOffset, y: target.y };

  const sourcePoint = {
    x: source.x,
    y: source.y,
  };
  const targetPoint = {
    x: target.x,
    y: target.y,
  };

  return [sourcePoint, point1, point2, targetPoint];
};
