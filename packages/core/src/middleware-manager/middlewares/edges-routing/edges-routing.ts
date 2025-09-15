import { EdgeRoutingManager } from '../../../edge-routing-manager';
import { Edge, FlowStateUpdate, Middleware, MiddlewareContext, Node, Point } from '../../../types';
import { isSamePoint } from '../../../utils';
import { DEFAULT_SELECTED_Z_INDEX } from '../z-index-assignment';
import { getEdgePoints } from './get-edge-points';

export interface EdgesRoutingMiddlewareMetadata {
  enabled: boolean;
  temporaryEdgeZIndex: number;
}

/**
 * Determines if edges should be re-routed based on changes in the flow state.
 */
export const checkIfShouldRouteEdges = ({ helpers, modelActionType }: MiddlewareContext): boolean =>
  modelActionType === 'init' ||
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
  ]);

/**
 * Determines if a specific edge should be routed based on changes.
 */
export const shouldRouteEdge = (
  edge: Edge,
  helpers: MiddlewareContext['helpers'],
  modelActionType: MiddlewareContext['modelActionType']
): boolean => {
  const isEdgeOrNodesChanged =
    helpers.checkIfEdgeChanged(edge.id) ||
    helpers.checkIfNodeChanged(edge.source) ||
    helpers.checkIfNodeChanged(edge.target);

  return isEdgeOrNodesChanged || modelActionType === 'init';
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
    position: routingManager.computePointOnPath(edge.routing, points, label.positionOnEdge),
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
  modelActionType: MiddlewareContext['modelActionType']
): NonNullable<FlowStateUpdate['edgesToUpdate']> => {
  const edgesToUpdate: NonNullable<FlowStateUpdate['edgesToUpdate']> = [];

  edges.forEach((edge) => {
    if (!shouldRouteEdge(edge, helpers, modelActionType)) {
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

export const edgesRoutingMiddleware: Middleware<'edges-routing', EdgesRoutingMiddlewareMetadata> = {
  name: 'edges-routing',
  defaultMetadata: {
    enabled: true,
    temporaryEdgeZIndex: DEFAULT_SELECTED_Z_INDEX,
  },
  execute: (context, next) => {
    const {
      state: { edges, metadata },
      nodesMap,
      edgeRoutingManager,
      helpers,
      modelActionType,
      middlewareMetadata,
    } = context;

    if (!middlewareMetadata.enabled) {
      next();
      return;
    }

    const temporaryEdgeZIndex = middlewareMetadata.temporaryEdgeZIndex || DEFAULT_SELECTED_Z_INDEX;

    const shouldRouteEdges = checkIfShouldRouteEdges(context);
    const shouldUpdateTemporaryEdge = helpers.checkIfMetadataPropsChanged(['temporaryEdge']) && metadata.temporaryEdge;

    if (!shouldRouteEdges && !shouldUpdateTemporaryEdge) {
      next();
      return;
    }

    const edgesToUpdate = shouldRouteEdges
      ? processEdgesForRouting(edges, nodesMap, edgeRoutingManager, helpers, modelActionType)
      : [];

    const newTemporaryEdge =
      shouldUpdateTemporaryEdge && metadata.temporaryEdge
        ? createUpdatedTemporaryEdge(metadata.temporaryEdge, nodesMap, edgeRoutingManager, temporaryEdgeZIndex)
        : undefined;

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
