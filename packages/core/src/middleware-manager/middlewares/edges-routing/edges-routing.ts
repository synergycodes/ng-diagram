import { EdgeRoutingContext, EdgeRoutingManager } from '../../../edge-routing-manager';
import { Edge, FlowStateUpdate, Middleware, MiddlewareContext, Node, Point, PortLocation } from '../../../types';
import { isSamePoint } from '../../../utils';
import { DEFAULT_SELECTED_Z_INDEX } from '../z-index-assignment';
import { getSourceTargetPositions } from './get-source-target-positions.ts';

export interface EdgesRoutingMiddlewareMetadata {
  enabled: boolean;
  temporaryEdgeZIndex: number;
}

const checkIfShouldRouteEdges = ({ helpers, modelActionType }: MiddlewareContext) =>
  modelActionType === 'init' ||
  helpers.anyEdgesAdded() ||
  helpers.checkIfAnyNodePropsChanged(['position', 'size', 'angle', 'ports']) ||
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

const getPoints = (edge: Edge, nodesMap: Map<string, Node>, routingManager: EdgeRoutingManager) => {
  const sourceTarget = getSourceTargetPositions(edge, nodesMap);
  const source = sourceTarget[0] as PortLocation;
  const target = sourceTarget[1] as PortLocation;
  const sourcePoint = source?.x
    ? {
        x: source.x,
        y: source.y,
      }
    : undefined;
  const targetPoint = target?.x
    ? {
        x: target.x,
        y: target.y,
      }
    : undefined;

  let points: Point[] = [];
  const mode = edge.routingMode || 'auto';

  // Manual mode: use user-provided points
  if (mode === 'manual' && edge.points && edge.points?.length > 0) {
    points = edge.points;
  } else {
    // Auto mode: compute points using routing algorithm
    const sourceNode = nodesMap.get(edge.source);
    const targetNode = nodesMap.get(edge.target);

    if (!sourceNode || !targetNode) {
      // Fallback if nodes not found
      points = [sourcePoint, targetPoint].filter((point) => !!point);
      return { sourcePoint, targetPoint, points };
    }

    // Find ports if they exist
    const sourcePort = edge.sourcePort ? sourceNode.ports?.find((p) => p.id === edge.sourcePort) : undefined;
    const targetPort = edge.targetPort ? targetNode.ports?.find((p) => p.id === edge.targetPort) : undefined;

    // Create routing context with full information
    const context: EdgeRoutingContext = {
      sourcePoint: source,
      targetPoint: target,
      edge,
      sourceNode,
      targetNode,
      sourcePort,
      targetPort,
    };

    if (edge.routing && routingManager.hasRouting(edge.routing)) {
      points = routingManager.computePoints(edge.routing, context);
    } else {
      // Use default routing or fallback to straight line
      const defaultRouting = routingManager.getDefaultRouting();
      if (routingManager.hasRouting(defaultRouting)) {
        points = routingManager.computePoints(defaultRouting, context);
      } else {
        // Final fallback to straight line
        points = [sourcePoint, targetPoint].filter((point) => !!point);
      }
    }
  }

  return { sourcePoint, targetPoint, points };
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
      helpers,
      modelActionType,
      middlewareMetadata,
      flowCore,
    } = context;
    // Access the typed middleware metadata
    const isEnabled = middlewareMetadata.enabled;
    const temporaryEdgeZIndex = middlewareMetadata.temporaryEdgeZIndex || DEFAULT_SELECTED_Z_INDEX;
    const routingManager = flowCore.edgeRoutingManager;

    if (!isEnabled) {
      next();
      return;
    }

    const shouldRouteEdges = checkIfShouldRouteEdges(context);
    const shouldUpdateTemporaryEdge = helpers.checkIfMetadataPropsChanged(['temporaryEdge']) && metadata.temporaryEdge;

    if (!shouldRouteEdges && !shouldUpdateTemporaryEdge) {
      next();
      return;
    }

    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

    if (shouldRouteEdges) {
      edges.forEach((edge) => {
        const isEdgeOrNodesChanged =
          helpers.checkIfEdgeChanged(edge.id) ||
          helpers.checkIfNodeChanged(edge.source) ||
          helpers.checkIfNodeChanged(edge.target);

        // Manual mode edges don't update points unless explicitly changed
        const isManualMode = edge.routingMode === 'manual';

        const shouldRoute = isEdgeOrNodesChanged || modelActionType === 'init';

        if (!shouldRoute) {
          return;
        }

        const { sourcePoint, targetPoint, points } = getPoints(edge, nodesMap, routingManager);

        if (isManualMode) {
          const updatedLabels = edge.labels?.map((label) => ({
            ...label,
            position: routingManager.computePointOnPath(edge.routing, points, label.positionOnEdge),
          }));

          if (updatedLabels?.length || sourcePoint || targetPoint) {
            edgesToUpdate.push({
              id: edge.id,
              sourcePosition: sourcePoint || undefined,
              targetPosition: targetPoint || undefined,
              labels: updatedLabels,
            });
          }
        } else {
          // Auto mode: update points if they changed
          if (
            points &&
            points.length > 0 &&
            edge.points?.length === points.length &&
            edge.points?.every((point, index) => isSamePoint(point, points[index]))
          ) {
            return;
          }

          const updatedLabels = edge.labels?.map((label) => ({
            ...label,
            position: routingManager.computePointOnPath(edge.routing, points, label.positionOnEdge),
          }));

          edgesToUpdate.push({
            id: edge.id,
            points,
            sourcePosition: sourcePoint || undefined,
            targetPosition: targetPoint || undefined,
            labels: updatedLabels,
          });
        }
      });
    }

    let newTemporaryEdge: Edge | undefined = undefined;

    if (shouldUpdateTemporaryEdge && metadata.temporaryEdge) {
      const edge = metadata.temporaryEdge;
      const { sourcePoint, targetPoint, points } = getPoints(edge, nodesMap, routingManager);

      newTemporaryEdge = {
        ...metadata.temporaryEdge,
        points,
        sourcePosition: sourcePoint || undefined,
        targetPosition: targetPoint || undefined,
        zIndex: temporaryEdgeZIndex,
      };
    }

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
