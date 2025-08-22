import { Point, PortSide } from '../../../../types';

/**
 * Calculates the offset point based on the given position.
 *
 * @param point - The original point with x and y coordinates.
 * @param position - The position assigned to Handle (Left, Right, Top, Bottom).
 * @param distance - The distance to offset from the point (default: 20).
 * @returns An object containing the new x and y coordinates after applying the offset.
 */
export const getOffsetPoint = (point: Point, position: PortSide, distance = 20) => {
  const offset = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    top: { x: 0, y: -distance },
    bottom: { x: 0, y: distance },
  }[position] || { x: 0, y: 0 };

  return {
    x: point.x + offset.x,
    y: point.y + offset.y,
  };
};
