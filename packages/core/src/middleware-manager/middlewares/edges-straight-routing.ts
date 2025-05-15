import type { Edge, Middleware, ModelActionType } from '../../types';

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

const getPoints = (edge: Edge, nodePositionMap: Map<string, { x: number; y: number }>) => {
  return [
    nodePositionMap.get(edge.source) || edge.sourcePosition,
    nodePositionMap.get(edge.target) || edge.targetPosition,
  ].filter((point) => !!point);
};

export const edgesStraightRoutingMiddleware: Middleware = {
  name: 'edges-straight-routing',
  execute: (state, context) => {
    const { edges, metadata } = state;
    const isRegularEdgeAction = regularEdgeActions.has(context.modelActionType);
    const isTemporaryEdgeAction = temporaryEdgeActions.has(context.modelActionType);

    if (!isRegularEdgeAction && !isTemporaryEdgeAction) {
      return state;
    }

    let newEdges = edges;

    const nodePositionMap = new Map<string, { x: number; y: number }>();
    state.nodes.forEach((node) => {
      nodePositionMap.set(node.id, node.position);
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
          const points = getPoints(edge, nodePositionMap);

          if (edge.points?.length === points.length && edge.points?.every((point, index) => point === points[index])) {
            return edge;
          }

          return {
            ...edge,
            points,
            sourcePosition: points[0],
            targetPosition: points[1],
          };
        });
      }
    }

    let newMetadata = metadata;

    if (isTemporaryEdgeAction && metadata.temporaryEdge) {
      const points = getPoints(metadata.temporaryEdge, nodePositionMap);

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

    return { ...state, edges: newEdges, metadata: newMetadata };
  },
};
