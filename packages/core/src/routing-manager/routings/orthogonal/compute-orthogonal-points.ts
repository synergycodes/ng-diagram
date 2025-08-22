import { Point, PortLocation } from '../../../types';
import { getPathPoints } from './utils/pathpoints';

/**
 * Calculates the path points for orthogonal routing between two positions.
 *
 *
 * @returns {Array} pathPoints - An array of path points for the orthogonal routing.
 * @param source
 * @param target
 * @param firstLastSegmentLength - The length of the first and last segments extending from ports
 */
export const computeOrthogonalPoints = (
  source: PortLocation,
  target: PortLocation,
  firstLastSegmentLength = 20
): Point[] => {
  const centerX = (source?.x + target?.x) / 2;

  const centerY = (source.y + target.y) / 2;
  const midpoints =
    getPathPoints(
      source,
      target,
      {
        x: centerX,
        y: centerY,
      },
      firstLastSegmentLength
    ) || [];

  const sourcePoint = {
    x: source.x,
    y: source.y,
  };
  const targetPoint = {
    x: target.x,
    y: target.y,
  };

  return [sourcePoint, ...midpoints, targetPoint];
};
