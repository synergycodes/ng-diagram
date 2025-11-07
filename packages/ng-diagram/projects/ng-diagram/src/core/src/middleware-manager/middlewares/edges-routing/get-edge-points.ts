import { EdgeRoutingContext, EdgeRoutingManager } from '../../../edge-routing-manager';
import { Edge, Node, Point, PortLocation } from '../../../types';
import { getSourceTargetPositions } from './get-source-target-positions';

/**
 * Checks if the required ports for an edge are properly initialized with position and size.
 * Returns true only if all required ports have their geometry data.
 */
export const areEdgePortsInitialized = (edge: Edge, sourceNode?: Node, targetNode?: Node): boolean => {
  if (edge.sourcePort) {
    const sourcePorts = sourceNode?.measuredPorts;
    if (!sourcePorts) {
      return false;
    }
    const sourcePort = sourcePorts.find((p) => p.id === edge.sourcePort);
    if (!sourcePort || !sourcePort.position || !sourcePort.size) {
      return false;
    }
  }

  if (edge.targetPort) {
    const targetPorts = targetNode?.measuredPorts;
    if (!targetPorts) {
      return false;
    }
    const targetPort = targetPorts.find((p) => p.id === edge.targetPort);
    if (!targetPort || !targetPort.position || !targetPort.size) {
      return false;
    }
  }

  return true;
};

/**
 * Checks if edge should skip port initialization check.
 * Manual mode edges with predefined points don't need to wait for ports.
 */
export const shouldSkipPortInitCheck = (edge: Edge): boolean => {
  return edge.routingMode === 'manual' && !!edge.points && edge.points.length > 0;
};

/**
 * Converts a PortLocation to a Point object.
 */
export const portLocationToPoint = (location: PortLocation | undefined): Point | undefined => {
  return location?.x !== undefined ? { x: location.x, y: location.y } : undefined;
};

/**
 * Finds a port by ID in a node's ports array.
 */
export const findNodePort = (node: Node | undefined, portId: string | undefined) => {
  return node && portId ? node.measuredPorts?.find((p) => p.id === portId) : undefined;
};

/**
 * Computes points for auto mode edges using routing algorithms.
 */
export const computeAutoModePoints = (
  edge: Edge,
  source: PortLocation,
  target: PortLocation,
  sourceNode: Node | undefined,
  targetNode: Node | undefined,
  routingManager: EdgeRoutingManager
): Point[] => {
  const context: EdgeRoutingContext = {
    sourcePoint: source,
    targetPoint: target,
    edge,
    sourceNode,
    targetNode,
    sourcePort: findNodePort(sourceNode, edge.sourcePort),
    targetPort: findNodePort(targetNode, edge.targetPort),
  };

  if (edge.routing && routingManager.hasRouting(edge.routing)) {
    return routingManager.computePoints(edge.routing, context);
  }

  // Warn if edge specified a routing that wasn't registered
  if (edge.routing && !routingManager.hasRouting(edge.routing)) {
    console.warn(
      `[ngDiagram] Edge routing '${edge.routing}' is not registered. Falling back to default routing.

Documentation: https://www.ngdiagram.dev/docs/guides/edges/routing/
`
    );
  }

  const defaultRouting = routingManager.getDefaultRouting();
  if (routingManager.hasRouting(defaultRouting)) {
    return routingManager.computePoints(defaultRouting, context);
  }

  const sourcePoint = portLocationToPoint(source);
  const targetPoint = portLocationToPoint(target);
  return [sourcePoint, targetPoint].filter((point): point is Point => !!point);
};

/**
 * Gets edge points based on routing mode and configuration.
 */
export const getEdgePoints = (edge: Edge, nodesMap: Map<string, Node>, routingManager: EdgeRoutingManager) => {
  const sourceNode = nodesMap.get(edge.source);
  const targetNode = nodesMap.get(edge.target);

  // Check if we should wait for port initialization
  if (!shouldSkipPortInitCheck(edge) && !areEdgePortsInitialized(edge, sourceNode, targetNode)) {
    // Return empty to hide edge temporarily (prevents blinking during initialization)
    return { sourcePoint: undefined, targetPoint: undefined, points: [] };
  }

  const [source, target] = getSourceTargetPositions(edge, nodesMap) as [PortLocation, PortLocation];
  const sourcePoint = portLocationToPoint(source);
  const targetPoint = portLocationToPoint(target);

  const isManualMode = edge.routingMode === 'manual';
  const hasManualPoints = edge.points && edge.points.length > 0;

  const points =
    isManualMode && hasManualPoints
      ? edge.points // Use user-provided points for manual mode
      : computeAutoModePoints(edge, source, target, sourceNode, targetNode, routingManager);

  return { sourcePoint, targetPoint, points };
};
