import { getInitialPathPoints } from './initial-positions/get-initial-path-points.ts';
import { Point, PortSide } from '../../types';

/**
 * Calculates the path points for orthogonal routing between two positions.
 *
 * @param {PortSide} sourcePosition - The position of the source handle.
 * @param {PortSide} targetPosition - The position of the target handle.
 * @param {Point} xySource - The x and y coordinates of the source handle.
 * @param {Point} xyTarget - The x and y coordinates of the target handle.
 *
 * @returns {Array} pathPoints - An array of path points for the orthogonal routing.
 */
export const getPathPoints = (
  sourcePosition: PortSide,
  targetPosition: PortSide,
  xySource: Point,
  xyTarget: Point
): Array<any> => {
  const centerX = (xySource.x + xyTarget.x) / 2;

  const centerY = (xySource.y + xyTarget.y) / 2;
  return (
    getInitialPathPoints(sourcePosition, targetPosition, xySource, xyTarget, {
      x: centerX,
      y: centerY,
    }) || []
  );
};
