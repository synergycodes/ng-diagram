import { EdgeRoutingManager, resolveLabelPosition } from '../../../edge-routing-manager';
import { Edge, FlowStateUpdate, Middleware, MiddlewareContext, Node, Point } from '../../../types';
import { isSamePoint } from '../../../utils';
import { DEFAULT_SELECTED_Z_INDEX } from '../z-index-assignment';
import { getEdgePoints } from './get-edge-points';

/**
 * Determines if edges should be re-routed based on changes in the flow state.
 */
export const checkIfShouldRouteEdges = ({
  helpers,
  modelActionTypes,
  actionStateManager,
}: MiddlewareContext): boolean => {
  // Skip edge routing during viewport-only operation (zoom)
  // Node positions don't change, only the viewport transform changes
  if (modelActionTypes.includes('zoom')) {
    return false;
  }

  // Skip edge routing during resize - ports will be updated separately and trigger routing then
  // This prevents visual lag where edges are drawn with old port positions
  if (modelActionTypes.includes('resizeNode') && actionStateManager.isResizing()) {
    return false;
  }

  return (
    modelActionTypes.includes('init') ||
    helpers.anyEdgesAdded() ||
    helpers.checkIfAnyNodePropsChanged(['position', 'size', 'angle', 'measuredPorts']) ||
    helpers.checkIfAnyEdgePropsChanged([
      'targetPosition',
      'sourcePosition',
      'points',
      'sourcePort',
      'targetPort',
      'source',
      'target',
      'routing',
      'routingMode',
    ])
  );
};

/**
 * Determines if a specific edge should be routed based on changes.
 */
export const shouldRouteEdge = (
  edge: Edge,
  helpers: MiddlewareContext['helpers'],
  modelActionTypes: MiddlewareContext['modelActionTypes']
): boolean => {
  const isEdgeOrNodesChanged =
    helpers.checkIfEdgeAdded(edge.id) ||
    helpers.checkIfEdgeChanged(edge.id) ||
    helpers.checkIfNodeChanged(edge.source) ||
    helpers.checkIfNodeChanged(edge.target);

  return isEdgeOrNodesChanged || modelActionTypes.includes('init');
};

/**
 * Checks if points have changed between old and new arrays.
 */
export const havePointsChanged = (oldPoints: Point[] | undefined, newPoints: Point[]): boolean => {
  if (!oldPoints) return true;
  if (oldPoints.length !== newPoints.length) return true;
  return !oldPoints.every((point, index) => isSamePoint(point, newPoints[index]));
};

/**
 * Updates label positions based on edge points.
 */
export const updateLabelPositions = (edge: Edge, points: Point[], routingManager: EdgeRoutingManager) => {
  return edge.measuredLabels?.map((label) => ({
    ...label,
    position: resolveLabelPosition(label.positionOnEdge, edge.routing, points, routingManager),
  }));
};

/**
 * Processes a single edge for manual routing mode.
 */
export const processManualModeEdge = (
  edge: Edge,
  sourcePoint: Point | undefined,
  targetPoint: Point | undefined,
  points: Point[],
  routingManager: EdgeRoutingManager
): (Partial<Edge> & { id: string }) | null => {
  const updatedLabels = updateLabelPositions(edge, points, routingManager);

  if (updatedLabels?.length || sourcePoint || targetPoint) {
    return {
      id: edge.id,
      sourcePosition: sourcePoint,
      targetPosition: targetPoint,
      measuredLabels: updatedLabels,
    };
  }
  return null;
};

/**
 * Processes a single edge for auto routing mode.
 */
export const processAutoModeEdge = (
  edge: Edge,
  sourcePoint: Point | undefined,
  targetPoint: Point | undefined,
  points: Point[],
  routingManager: EdgeRoutingManager
): (Partial<Edge> & { id: string }) | null => {
  // Skip if points haven't changed
  if (!havePointsChanged(edge.points, points)) {
    return null;
  }

  const updatedLabels = updateLabelPositions(edge, points, routingManager);

  return {
    id: edge.id,
    points,
    sourcePosition: sourcePoint,
    targetPosition: targetPoint,
    measuredLabels: updatedLabels,
  };
};

/**
 * Processes edges that need routing updates.
 */
export const processEdgesForRouting = (
  edges: Edge[],
  nodesMap: Map<string, Node>,
  routingManager: EdgeRoutingManager,
  helpers: MiddlewareContext['helpers'],
  modelActionTypes: MiddlewareContext['modelActionTypes']
): NonNullable<FlowStateUpdate['edgesToUpdate']> => {
  const edgesToUpdate: NonNullable<FlowStateUpdate['edgesToUpdate']> = [];

  edges.forEach((edge) => {
    if (!shouldRouteEdge(edge, helpers, modelActionTypes)) {
      return;
    }

    const { sourcePoint, targetPoint, points } = getEdgePoints(edge, nodesMap, routingManager);

    // Skip if we don't have valid points (e.g., ports not initialized)
    if (!points || points.length === 0) {
      return;
    }

    const isManualMode = edge.routingMode === 'manual';

    const update = isManualMode
      ? processManualModeEdge(edge, sourcePoint, targetPoint, points, routingManager)
      : processAutoModeEdge(edge, sourcePoint, targetPoint, points, routingManager);

    if (update) {
      edgesToUpdate.push(update);
    }
  });

  return edgesToUpdate;
};

/**
 * Creates an updated temporary edge with new routing.
 */
export const createUpdatedTemporaryEdge = (
  temporaryEdge: Edge,
  nodesMap: Map<string, Node>,
  routingManager: EdgeRoutingManager,
  zIndex: number
): Edge => {
  const { sourcePoint, targetPoint, points } = getEdgePoints(temporaryEdge, nodesMap, routingManager);

  return {
    ...temporaryEdge,
    points,
    sourcePosition: sourcePoint,
    targetPosition: targetPoint,
    computedZIndex: zIndex,
  };
};

export const edgesRoutingMiddleware: Middleware = {
  name: 'edges-routing',
  execute: (context, next) => {
    const {
      state: { edges },
      nodesMap,
      edgeRoutingManager,
      actionStateManager,
      helpers,
      modelActionTypes,
      config: { zIndex },
    } = context;

    const temporaryEdgeZIndex = zIndex.temporaryEdgeZIndex || DEFAULT_SELECTED_Z_INDEX;

    const shouldRouteEdges = checkIfShouldRouteEdges(context);
    const temporaryEdge = actionStateManager.linking?.temporaryEdge;

    if (!shouldRouteEdges && !temporaryEdge) {
      next();
      return;
    }

    const edgesToUpdate = shouldRouteEdges
      ? processEdgesForRouting(edges, nodesMap, edgeRoutingManager, helpers, modelActionTypes)
      : [];

    const newTemporaryEdge = temporaryEdge
      ? createUpdatedTemporaryEdge(temporaryEdge, nodesMap, edgeRoutingManager, temporaryEdgeZIndex)
      : undefined;

    if (newTemporaryEdge && actionStateManager.linking) {
      actionStateManager.linking = {
        ...actionStateManager.linking,
        temporaryEdge: newTemporaryEdge,
      };
    }

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
    });
  },
};
