import type { Edge, FlowStateUpdate, Middleware, MiddlewareContext, Node } from '../../types';
import { getPointOnPath, getPortFlowPosition, isSamePoint } from '../../utils';
import { getPathPoints } from '../../utils/edges-orthogonal-routing/get-path-points.ts';
import { Position } from '../../utils/edges-orthogonal-routing/initial-positions/get-initial-path-points.ts';

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
  ]);

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

export const edgesRoutingMiddleware: Middleware = {
  name: 'edges-routing',
  execute: (context, next) => {
    const {
      state: { edges, metadata },
      nodesMap,
      helpers,
      modelActionType,
    } = context;
    const shouldRouteEdges = checkIfShouldRouteEdges(context);
    const shouldUpdateTemporaryEdge = helpers.checkIfMetadataPropsChanged(['temporaryEdge']) && metadata.temporaryEdge;

    if (!shouldRouteEdges && !shouldUpdateTemporaryEdge) {
      next();
      return;
    }

    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];

    if (shouldRouteEdges) {
      edges.forEach((edge) => {
        // const isProperEdgeRouting = edge.routing === 'orthogonal' || edge.routing === undefined;
        const isEdgeOrNodesChanged =
          helpers.checkIfEdgeChanged(edge.id) ||
          helpers.checkIfNodeChanged(edge.source) ||
          helpers.checkIfNodeChanged(edge.target);
        const shouldRoute = (isEdgeOrNodesChanged || modelActionType === 'init');
        if (!shouldRoute) {
          return;
        }

        const points = getPoints(edge, nodesMap);
        if (edge.routing === 'orthogonal' || true) {
          const middlePoints = getPathPoints(Position.Right, Position.Left,points[0], points[1]);
          points.splice(1, 0, ...middlePoints)
        }

        if (
          edge.points?.length === points.length &&
          edge.points?.every((point, index) => isSamePoint(point, points[index]))
        ) {
          return;
        }

        const updatedLabels = edge.labels?.map((label) => ({
          ...label,
          position: getPointOnPath(points, label.positionOnEdge),
        }));

        edgesToUpdate.push({
          id: edge.id,
          points,
          sourcePosition: points[0],
          targetPosition: points[1],
          labels: updatedLabels,
        });
      });
    }
    let newTemporaryEdge: Edge | undefined = undefined;

    if (shouldUpdateTemporaryEdge && metadata.temporaryEdge) {
      const points = getPoints(metadata.temporaryEdge, nodesMap);

      newTemporaryEdge = {
        ...metadata.temporaryEdge,
        points,
        sourcePosition: points[0],
        targetPosition: points[1],
      };
    }

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
