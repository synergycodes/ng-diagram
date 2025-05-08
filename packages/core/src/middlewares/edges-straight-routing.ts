import { Middleware, ModelActionType } from '../types';

const actionsToReactOn = new Set<ModelActionType>([
  'addEdges',

  'updateEdge',
  'updateNode',

  'deleteEdges',
  'deleteNodes',
  'deleteSelection',

  'moveSelection',
  'paste',
]);

export const edgesStraightRoutingMiddleware: Middleware = {
  name: 'edges-straight-routing',
  execute: (state, context) => {
    if (!actionsToReactOn.has(context.modelActionType)) {
      return state;
    }

    const edgesToRouteIds = new Set<string>();
    state.edges.forEach((edge) => {
      if (edge.routing === 'straight' || !edge.routing) {
        edgesToRouteIds.add(edge.id);
      }
    });

    if (edgesToRouteIds.size === 0) {
      return state;
    }

    const nodePositionMap = new Map<string, { x: number; y: number }>();
    state.nodes.forEach((node) => {
      nodePositionMap.set(node.id, node.position);
    });

    const newEdges = state.edges.map((edge) => {
      if (!edgesToRouteIds.has(edge.id)) {
        return edge;
      }
      // TODO: Replace with proper edge calculation when ports are implemented
      const points = [nodePositionMap.get(edge.source), nodePositionMap.get(edge.target)].filter((point) => !!point);

      return {
        ...edge,
        points,
        sourcePosition: points[0],
        targetPosition: points[1],
      };
    });

    return { ...state, edges: newEdges };
  },
};
