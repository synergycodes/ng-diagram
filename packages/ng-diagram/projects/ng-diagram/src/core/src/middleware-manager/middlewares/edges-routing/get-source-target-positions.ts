import type { Edge, Node, Point, PortLocation, PortSide } from '../../../types';
import { getNodeBorderIntersection, getPortFlowPositionSide } from '../../../utils';
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

  // First pass: get preliminary positions to use as reference points
  const sourceNode = nodesMap.get(edge.source);
  const targetNode = nodesMap.get(edge.target);

  const preliminarySourcePoint = getPreliminaryPosition(sourceNode, edge.sourcePort, edge.sourcePosition);
  const preliminaryTargetPoint = getPreliminaryPosition(targetNode, edge.targetPort, edge.targetPosition);

  // Second pass: calculate final positions with correct 'from' points for border intersections
  const sourcePoint = getPosition(
    nodesMap,
    edge.source,
    sourceSide,
    edge.sourcePort,
    edge.sourcePosition,
    preliminaryTargetPoint
  );

  const targetPoint = getPosition(
    nodesMap,
    edge.target,
    targetSide,
    edge.targetPort,
    edge.targetPosition,
    preliminarySourcePoint
  );

  return {
    source: isValidPortLocation(sourcePoint) ? sourcePoint : undefined,
    target: isValidPortLocation(targetPoint) ? targetPoint : undefined,
  };
};

const isValidPortLocation = (
  location: { x?: number; y?: number; side?: PortSide } | undefined
): location is PortLocation => {
  return !!location && location.x !== undefined && location.y !== undefined && !!location.side;
};

/**
 * Gets a preliminary position for a node endpoint.
 * This is used as a reference point when calculating border intersections.
 * Returns either the port position, the node center, or a fallback position.
 */
const getPreliminaryPosition = (node: Node | undefined, portId?: string, fallbackPosition?: Point): Point => {
  if (!node) {
    return fallbackPosition || { x: 0, y: 0 };
  }

  // If there's a port, use its position
  if (portId) {
    const portPosition = getPortFlowPositionSide(node, portId);
    if (portPosition) {
      return { x: portPosition.x, y: portPosition.y };
    }
  }

  // Otherwise, use the node center as reference point
  return {
    x: node.position.x + (node.size?.width || 0) / 2,
    y: node.position.y + (node.size?.height || 0) / 2,
  };
};

/**
 * Calculates and returns the coordinates of a port on a given node and edge.
 *
 * @param node - The node to get the position from
 * @param defaultSide - Default side to use if port not found
 * @param portId - Optional port ID
 * @param position - Optional fallback position
 * @param fromPoint - Point where the edge is coming from (used for border intersection calculation)
 */
export const getPoint = (node: Node, defaultSide: PortSide, portId?: string, position?: Point, fromPoint?: Point) => {
  if (!node) {
    return { ...position, side: defaultSide };
  }

  if (!portId) {
    // Use fromPoint for border intersection, or fall back to node center of opposite end
    const from = fromPoint || position || { x: 0, y: 0 };
    return getNodeBorderIntersection(node, from);
  }

  const portPosition = getPortFlowPositionSide(node, portId);

  return portPosition || { ...position, side: defaultSide };
};

const getPosition = (
  nodesMap: Map<string, Node>,
  nodeId: string,
  defaultSide: PortSide,
  portId?: string,
  position?: Point,
  fromPoint?: Point
) => {
  const node = nodesMap.get(nodeId);
  if (!node) {
    return { ...position, side: defaultSide };
  }
  return getPoint(node, defaultSide, portId, position, fromPoint);
};
