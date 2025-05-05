import { Middleware, ModelActionType } from '../types';

const actionsToReactOn = new Set<ModelActionType>([
  'addEdges',
  'deleteEdges',
  'deleteNodes',
  'updateEdge',
  'updateNode',
  'moveSelection',
  'paste',
]);

export const straightEdgesMiddleware: Middleware = {
  name: 'straight-edges',
  execute: (state, context) => {
    if (!actionsToReactOn.has(context.modelActionType)) {
      return state;
    }

    const newEdges = state.edges.map((edge) => {
      if (typeof edge.source !== 'string' && typeof edge.target !== 'string') {
        return { ...edge, points: [edge.source, edge.target] };
      }
      // TODO: Handle calculating points between elements
      return edge;
    });

    return { ...state, edges: newEdges };
  },
};
