import { getInitialPathPoints } from './initial-positions/get-initial-path-points.ts';
import { Point, PortLocation } from '../../types';

/**
 * Calculates the path points for orthogonal routing between two positions.
 *
 *
 * @returns {Array} pathPoints - An array of path points for the orthogonal routing.
 * @param source
 * @param target
 */
export const getOrthogonalPathPoints = (source: PortLocation, target: PortLocation): Point[] => {
  const centerX = (source?.x + target?.x) / 2;

  const centerY = (source.y + target.y) / 2;
  const midpoints =
    getInitialPathPoints(source, target, {
      x: centerX,
      y: centerY,
    }) || [];

  const { side: _, ...sourcePoint } = source;
  const { side: __, ...targetPoint } = target;

  return [sourcePoint, ...midpoints, targetPoint];
};
