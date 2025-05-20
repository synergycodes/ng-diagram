import { FlowCore } from '../../flow-core';
import type { Edge, Middleware, ModelActionType, Node } from '../../types';

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

const getPoints = (edge: Edge, nodesMap: Map<string, Node>, flowCore: FlowCore) => {
  const getPoint = (nodeId: string, portId?: string, position?: { x: number; y: number }) => {
    const node = nodesMap.get(nodeId);
    if (!node) {
      return position;
    }
    return portId ? flowCore.getFlowPortPosition(node, portId) : position;
  };

  const sourcePoint = getPoint(edge.source, edge.sourcePort, edge.sourcePosition);
  const targetPoint = getPoint(edge.target, edge.targetPort, edge.targetPosition);

  return [sourcePoint, targetPoint].filter((point) => !!point);
};

export const edgesStraightRoutingMiddleware: Middleware = {
  name: 'edges-straight-routing',
  execute: (state, context, flowCore) => {
    const { edges, metadata } = state;
    const isRegularEdgeAction = regularEdgeActions.has(context.modelActionType);
    const isTemporaryEdgeAction = temporaryEdgeActions.has(context.modelActionType);

    if (!isRegularEdgeAction && !isTemporaryEdgeAction) {
      return state;
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
          const points = getPoints(edge, nodesMap, flowCore);

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
      const points = getPoints(metadata.temporaryEdge, nodesMap, flowCore);

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
