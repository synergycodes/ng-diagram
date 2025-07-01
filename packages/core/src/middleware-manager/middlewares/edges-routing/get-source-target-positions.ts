import type { Edge, Node, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';
import { getHandlePosition } from './get-rotated-position.ts';

/**
 * Calculates and returns the source and target positions for a given edge based on the connected nodes.
 *
 * @param {Edge} edge - The edge object containing source and target node IDs.
 * @param {Map<string, Node>} nodesMap - A map of node IDs to node objects, used to look up node positions.
 */
export const getSourceTargetPositions = (edge: Edge, nodesMap: Map<string, Node>) => {
  const sourcePoint = getPosition(nodesMap, edge.source, 'right', edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPosition(nodesMap, edge.target, 'left', edge.targetPort, edge.targetPosition);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};

/**
 * Calculates and returns the coordinates of a port on a given node and edge.
 */
export const getPoint = (node: Node, defaultSide: PortSide, portId?: string, position?: { x: number; y: number }) => {
  if (!node || !portId) {
    return { ...position, side: defaultSide };
  }
  const portPosition = getPortFlowPositionSide(node, portId);
  const angle = node?.angle;
  if (angle != null && portPosition?.side) {
    const newPortSide = getHandlePosition(portPosition?.side, angle);
    if (newPortSide !== portPosition?.side) {
      portPosition.side = newPortSide;
    }
  }
  return portPosition;
};

const getPosition = (
  nodesMap: Map<string, Node>,
  nodeId: string,
  defaultSide: PortSide,
  portId?: string,
  position?: {
    x: number;
    y: number;
  }
) => {
  const node = nodesMap.get(nodeId);
  if (!node) {
    return { ...position, side: defaultSide };
  }
  return getPoint(node, defaultSide, portId, position);
};
