import type { Edge, Middleware, ModelActionType, Node } from '../../types';
import { getPointOnPath, getPortFlowPosition } from '../../utils';

const regularEdgeActions = new Set<ModelActionType>([
  'init',
  'addEdges',
  'updateEdge',
  'updateNode',
  'deleteEdges',
  'deleteNodes',
  'deleteSelection',
  'moveSelection',
  'paste',
  'finishLinking',
  'resizeNode',
]);

const temporaryEdgeActions = new Set<ModelActionType>(['startLinking', 'moveTemporaryEdge', 'finishLinking']);

const getPoints = (edge: Edge, nodesMap: Map<string, Node>) => {
  const getPoint = (nodeId: string, portId?: string, position?: { x: number; y: number }) => {
    const node = nodesMap.get(nodeId);
    if (!node) {
      return position;
    }
    return portId ? getPortFlowPosition(node, portId) : position;
  };

  const sourcePoint = getPoint(edge.source, edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPoint(edge.target, edge.targetPort, edge.targetPosition);

  return [sourcePoint, targetPoint].filter((point) => !!point);
};

export const edgesStraightRoutingMiddleware: Middleware = {
  name: 'edges-straight-routing',
  execute: async ({ state, modelActionType }, next) => {
    const { edges, metadata } = state;
    const isRegularEdgeAction = regularEdgeActions.has(modelActionType);
    const isTemporaryEdgeAction = temporaryEdgeActions.has(modelActionType);

    if (!isRegularEdgeAction && !isTemporaryEdgeAction) {
      return next();
    }

    let newEdges = edges;

    const nodesMap = new Map<string, Node>();
    state.nodes.forEach((node) => {
      nodesMap.set(node.id, node);
    });

    // Handle regular edges
    if (isRegularEdgeAction) {
      const edgesToRouteIds = new Set<string>();
      state.edges.forEach((edge) => {
        if (edge.routing === 'straight' || !edge.routing) {
          edgesToRouteIds.add(edge.id);
        }
      });

      if (edgesToRouteIds.size > 0) {
        newEdges = state.edges.map((edge) => {
          if (!edgesToRouteIds.has(edge.id)) {
            return edge;
          }
          const points = getPoints(edge, nodesMap);

          if (edge.points?.length === points.length && edge.points?.every((point, index) => point === points[index])) {
            return edge;
          }

          const updatedLabels = edge.labels?.map((label) => {
            const pointOnPath = getPointOnPath(points, label.positionOnEdge);
            return {
              ...label,
              position: pointOnPath,
            };
          });

          return {
            ...edge,
            points,
            sourcePosition: points[0],
            targetPosition: points[1],
            labels: updatedLabels,
          };
        });
      }
    }

    let newMetadata = metadata;

    if (isTemporaryEdgeAction && metadata.temporaryEdge) {
      const points = getPoints(metadata.temporaryEdge, nodesMap);

      newMetadata = {
        ...metadata,
        temporaryEdge: {
          ...metadata.temporaryEdge,
          points,
          sourcePosition: points[0],
          targetPosition: points[1],
        },
      };
    }

    next({ edges: newEdges, metadata: newMetadata });
  },
};
