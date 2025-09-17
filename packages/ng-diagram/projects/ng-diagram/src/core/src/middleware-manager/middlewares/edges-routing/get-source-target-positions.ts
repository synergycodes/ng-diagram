import type { Edge, Node, Point, PortSide } from '../../../types';
import { getPortFlowPositionSide } from '../../../utils';
import { computeFloatingEndSide } from '../../../utils/compute-floating-edge-side';

/**
 * Computes dynamic sides for temporary edge floating ends.
 * Returns undefined for sides that should use defaults.
 */
const getTemporaryEdgeSides = (
  edge: Edge,
  nodesMap: Map<string, Node>
): { sourceSide?: PortSide; targetSide?: PortSide } => {
  // Temporary edge with floating target (drawing from source)
  if (!edge.target && edge.targetPosition) {
    const startNode = nodesMap.get(edge.source);
    const targetSide = computeFloatingEndSide(startNode, edge.sourcePort, edge.targetPosition);
    return { targetSide };
  }

  // Temporary edge with floating source (reverse drawing from target)
  if (!edge.source && edge.sourcePosition && edge.targetPosition) {
    const endNode = nodesMap.get(edge.target);
    const sourceSide = computeFloatingEndSide(endNode, edge.targetPort, edge.sourcePosition);
    return { sourceSide };
  }

  // No special handling needed
  return {};
};

/**
 * Calculates and returns the source and target positions for a given edge based on the connected nodes.
 *
 * @param {Edge} edge - The edge object containing source and target node IDs.
 * @param {Map<string, Node>} nodesMap - A map of node IDs to node objects, used to look up node positions.
 */
export const getSourceTargetPositions = (edge: Edge, nodesMap: Map<string, Node>) => {
  // Get dynamic sides for temporary edges, if applicable
  const temporarySides = edge.temporary ? getTemporaryEdgeSides(edge, nodesMap) : {};

  // Use dynamic sides if available, otherwise use defaults
  const sourceSide = temporarySides.sourceSide ?? 'right';
  const targetSide = temporarySides.targetSide ?? 'left';

  const sourcePoint = getPosition(nodesMap, edge.source, sourceSide, edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPosition(nodesMap, edge.target, targetSide, edge.targetPort, edge.targetPosition);
  return [sourcePoint, targetPoint].filter((point) => !!point);
};

/**
 * Calculates and returns the coordinates of a port on a given node and edge.
 */
export const getPoint = (node: Node, defaultSide: PortSide, portId?: string, position?: Point) => {
  if (!node || !portId) {
    return { ...position, side: defaultSide };
  }

  const portPosition = getPortFlowPositionSide(node, portId);

  return portPosition || { ...position, side: defaultSide };
};

const getPosition = (
  nodesMap: Map<string, Node>,
  nodeId: string,
  defaultSide: PortSide,
  portId?: string,
  position?: Point
) => {
  const node = nodesMap.get(nodeId);
  if (!node) {
    return { ...position, side: defaultSide };
  }
  return getPoint(node, defaultSide, portId, position);
};
