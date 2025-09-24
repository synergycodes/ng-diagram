import { ContainerEdge, Point, Rect } from '../../types';

/**
 * Calculates the distance from the pointer to the nearest container edge.
 * For corner edges (topleft, topright, etc.), returns Manhattan distance.
 *
 * @param containerBox - The container bounding box
 * @param clientPosition - The current mouse/pointer position
 * @param edge - The detected edge
 * @returns Distance in pixels from the edge (0 = at edge, positive = away from edge)
 */
export const calculateDistanceFromEdge = (containerBox: Rect, clientPosition: Point, edge: ContainerEdge): number => {
  if (!edge) {
    return Infinity;
  }

  const localX = clientPosition.x - containerBox.x;
  const localY = clientPosition.y - containerBox.y;
  const innerWidth = containerBox.width;
  const innerHeight = containerBox.height;

  switch (edge) {
    case 'left':
      return localX;
    case 'right':
      return innerWidth - localX;
    case 'top':
      return localY;
    case 'bottom':
      return innerHeight - localY;
    case 'topleft':
      return Math.max(localX, localY);
    case 'topright':
      return Math.max(innerWidth - localX, localY);
    case 'bottomleft':
      return Math.max(localX, innerHeight - localY);
    case 'bottomright':
      return Math.max(innerWidth - localX, innerHeight - localY);
    default:
      return Infinity;
  }
};
