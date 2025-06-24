import { getInitialPathPoints, Position } from './initial-positions/get-initial-path-points.ts';
import { Point } from '../../types';

/**
 * Custom hook that calculates the path points for orthogonal routing between two positions.
 *
 * @param {Position} sourcePosition - The position of the source handle.
 * @param {Position} targetPosition - The position of the target handle.
 * @param {Point} xySource - The x and y coordinates of the source handle.
 * @param {Point} xyTarget - The x and y coordinates of the target handle.
 *
 * @returns {Array} pathPoints - An array of path points for the orthogonal routing.
 */
export const getPathPoints = (sourcePosition: Position, targetPosition: Position, xySource: Point, xyTarget: Point) => {
  const centerX = (xySource.x + xyTarget.x) / 2;

  const centerY = (xySource.y + xyTarget.y) / 2;
  const pathPoints =
    getInitialPathPoints(sourcePosition, targetPosition, xySource, xyTarget, {
      x: centerX,
      y: centerY,
    }) || [];

  return {
    pathPoints,
  };
};
