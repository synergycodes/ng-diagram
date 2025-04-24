import { Middleware } from '../types';

export const selectionChangeMiddleware: Middleware = (stateDiff, context) => {
  const { modelAction } = context;

  if (modelAction.type === 'selectionChange') {
    const { ids } = modelAction.payload;
    const allNodes = context.initialState.nodes;
    const allEdges = context.initialState.edges;
    const selectedIdsMap = new Map(ids.map((id) => [id, true]));

    if (!stateDiff.nodes) {
      stateDiff.nodes = {};
    }

    if (!stateDiff.edges) {
      stateDiff.edges = {};
    }

    if (!stateDiff.edges.updated) {
      stateDiff.edges.updated = {};
    }

    if (!stateDiff.nodes.updated) {
      stateDiff.nodes.updated = {};
    }

    for (const node of allNodes) {
      const shouldBeSelected = !!selectedIdsMap.get(node.id);

      stateDiff.nodes.updated[node.id] = {
        ...(stateDiff.nodes.updated[node.id] || {}),
        selected: shouldBeSelected,
      };
    }

    for (const edge of allEdges) {
      const shouldBeSelected = !!selectedIdsMap.get(edge.id);

      if (edge.selected !== shouldBeSelected) {
        stateDiff.edges.updated[edge.id] = {
          ...(stateDiff.edges.updated[edge.id] || {}),
          selected: shouldBeSelected,
        };
      }
    }
  }

  return stateDiff;
};
