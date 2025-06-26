import type { Edge, FlowStateUpdate, Middleware, MiddlewareContext, Node, PortLocation } from '../../../types';
import { getPointOnPath, isSamePoint } from '../../../utils';
import { getOrthogonalPathPoints } from '../../../utils/edges-orthogonal-routing/get-orthogonal-path-points.ts';
import { getSourceTarget } from './get-source-target.ts';

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
  const sourceTarget = getSourceTarget(edge, nodesMap);
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

  const points =
    edge.routing === 'orthogonal'
      ? getOrthogonalPathPoints(source, target)
      : [sourcePoint, targetPoint].filter((point) => !!point);

  return { sourcePoint, targetPoint, points };
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
        const isProperEdgeRouting =
          edge.routing === 'straight' || edge.routing === 'orthogonal' || edge.routing === undefined;
        const isEdgeOrNodesChanged =
          helpers.checkIfEdgeChanged(edge.id) ||
          helpers.checkIfNodeChanged(edge.source) ||
          helpers.checkIfNodeChanged(edge.target);
        const shouldRoute = isProperEdgeRouting && (isEdgeOrNodesChanged || modelActionType === 'init');
        if (!shouldRoute) {
          return;
        }

        const { sourcePoint, targetPoint, points } = getPoints(edge, nodesMap);

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
          sourcePosition: sourcePoint || undefined,
          targetPosition: targetPoint || undefined,
          labels: updatedLabels,
        });
      });
    }
    let newTemporaryEdge: Edge | undefined = undefined;

    if (shouldUpdateTemporaryEdge && metadata.temporaryEdge) {
      const edge = metadata.temporaryEdge;
      const { sourcePoint, targetPoint, points } = getPoints(edge, nodesMap);

      newTemporaryEdge = {
        ...metadata.temporaryEdge,
        points,
        sourcePosition: sourcePoint || undefined,
        targetPosition: targetPoint || undefined,
      };
    }

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
