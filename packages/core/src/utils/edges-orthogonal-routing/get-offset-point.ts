import { Point, PortSide } from '../../types';
import { POINT_DISTANCE } from './constants.ts';

/**
 * Calculates the offset point based on the given position.
 *
 * @param point - The original point with x and y coordinates.
 * @param position - The position assigned to Handle (Left, Right, Top, Bottom).
 * @returns An object containing the new x and y coordinates after applying the offset.
 */
export const getOffsetPoint = (point: Point, position: PortSide) => {
  const offset = {
    left: { x: -POINT_DISTANCE, y: 0 },
    right: { x: POINT_DISTANCE, y: 0 },
    top: { x: 0, y: -POINT_DISTANCE },
    bottom: { x: 0, y: POINT_DISTANCE },
  }[position] || { x: 0, y: 0 };

  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
};
