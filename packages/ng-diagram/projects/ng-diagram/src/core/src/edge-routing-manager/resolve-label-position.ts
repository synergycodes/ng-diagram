import { EdgeLabelPosition, Point } from '../types';
import { EdgeRoutingManager } from './edge-routing-manager';
import { EdgeRoutingName } from './types';

/**
 * Resolves the computed position of a label on an edge, supporting both
 * relative (number 0-1) and absolute (`'Npx'` string) positioning.
 *
 * @param positionOnEdge - The label position value (relative or absolute).
 * @param edgeRouting - The routing name for the edge.
 * @param points - The edge path points.
 * @param routingManager - The EdgeRoutingManager instance.
 * @returns The computed point on the path.
 */
export const resolveLabelPosition = (
  positionOnEdge: EdgeLabelPosition,
  edgeRouting: EdgeRoutingName | undefined,
  points: Point[],
  routingManager: EdgeRoutingManager
): Point => {
  if (typeof positionOnEdge === 'string') {
    const normalizedPosition = positionOnEdge.trim();
    if (normalizedPosition.endsWith('px')) {
      const px = parseFloat(normalizedPosition);
      return routingManager.computePointAtDistance(edgeRouting, points, px);
    }
    return routingManager.computePointOnPath(edgeRouting, points, parseFloat(normalizedPosition));
  }
  return routingManager.computePointOnPath(edgeRouting, points, positionOnEdge);
};
