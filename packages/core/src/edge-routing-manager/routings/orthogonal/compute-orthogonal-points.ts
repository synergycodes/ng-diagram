import { Point, PortLocation } from '../../../types';
import { getPathPoints } from './utils/pathpoints';

/**
 * Calculates the points for orthogonal routing between two ports.
 *
 * @remarks
 * - The routing always starts at `source` and ends at `target`.
 * - The length of the first and last segments can be configured via `firstLastSegmentLength`.
 *
 * @param source - Source {@link PortLocation}.
 * @param target - Target {@link PortLocation}.
 * @param [firstLastSegmentLength=20] - Minimum length of the first and last orthogonal segments.
 * @returns An array of {@link Point} values `[source, ...midpoints, target]` describing the path.
 *
 * @example
 * ```ts
 * const points = computeOrthogonalPoints(
 *   { x: 0, y: 0, side: 'right' },
 *   { x: 200, y: 100, side: 'left' },
 *   30
 * );
 * // -> [{x:0,y:0}, {...midpoints}, {x:200,y:100}]
 * ```
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
