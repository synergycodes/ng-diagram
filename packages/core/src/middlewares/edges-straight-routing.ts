import { Edge, Middleware, ModelActionType } from '../types';

const regularEdgeActions = new Set<ModelActionType>([
  'addEdges',
  'updateEdge',
  'updateNode',
  'deleteEdges',
  'deleteNodes',
  'deleteSelection',
  'moveSelection',
  'paste',
  'finishLinking',
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
    const isRegularEdgeAction = regularEdgeActions.has(context.modelActionType);
    const isTemporaryEdgeAction = temporaryEdgeActions.has(context.modelActionType);

    if (!isRegularEdgeAction && !isTemporaryEdgeAction) {
      return state;
    }

    let newEdges = state.edges;

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

      if (edgesToRouteIds.size === 0) {
        newEdges = state.edges;
      } else {
        newEdges = state.edges.map((edge) => {
          if (!edgesToRouteIds.has(edge.id)) {
            return edge;
          }
          const points = getPoints(edge, nodePositionMap);

          if (edge.points?.every((point, index) => point === points[index])) {
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

    let newTemporaryEdge = state.metadata.temporaryEdge;

    if (isTemporaryEdgeAction && state.metadata?.temporaryEdge) {
      const points = getPoints(state.metadata.temporaryEdge, nodePositionMap);

      if (state.metadata.temporaryEdge.points?.every((point, index) => point === points[index])) {
        return state;
      }

      newTemporaryEdge = {
        ...state.metadata.temporaryEdge,
        points,
        sourcePosition: points[0],
        targetPosition: points[1],
      };
    }

    return { ...state, edges: newEdges, metadata: { ...state.metadata, temporaryEdge: newTemporaryEdge } };
  },
};
