import {
  Edge,
  FlowStateUpdate,
  Middleware,
  MiddlewareContext,
  Node,
  PortLocation,
  RoutingConfiguration,
} from '../../../types';
import { getPointOnPath, isSamePoint } from '../../../utils';
import { getOrthogonalPathPoints } from '../../../utils/edges-orthogonal-routing/get-orthogonal-path-points.ts';
import { isDefaultRouting } from './utils/isRouting.ts';
import { DEFAULT_SELECTED_Z_INDEX } from '../z-index-assignment/constants.ts';
import { getSourceTargetPositions } from './get-source-target-positions.ts';
import { getBezierPathPoints } from '../../../utils/get-bezier-path-points.ts';

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
  ]);

const getPoints = (edge: Edge, nodesMap: Map<string, Node>, config?: RoutingConfiguration) => {
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

  let points = [];

  switch (edge.routing) {
    case 'orthogonal':
      points = getOrthogonalPathPoints(source, target);
      break;
    case 'bezier':
      points = getBezierPathPoints(source, target, config?.bezier?.bezierControlOffset);
      break;
    default:
      points = [sourcePoint, targetPoint].filter((point) => !!point);
      break;
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
    } = context;
    // Access the typed middleware metadata
    const isEnabled = middlewareMetadata.enabled;
    const temporaryEdgeZIndex = middlewareMetadata.temporaryEdgeZIndex || DEFAULT_SELECTED_Z_INDEX;

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
        const isCustomEdgeRouting = !!edge.type;
        const isProperEdgeRouting = isDefaultRouting(edge.routing);
        const isEdgeOrNodesChanged =
          helpers.checkIfEdgeChanged(edge.id) ||
          helpers.checkIfNodeChanged(edge.source) ||
          helpers.checkIfNodeChanged(edge.target);

        const shouldRoute = isProperEdgeRouting && (isEdgeOrNodesChanged || modelActionType === 'init');

        const shouldRouteCustomEdge =
          isCustomEdgeRouting &&
          (isEdgeOrNodesChanged || modelActionType === 'init') &&
          edge.type &&
          edge.type !== 'edge' &&
          !isProperEdgeRouting;

        if (shouldRouteCustomEdge) {
          const { sourcePoint, targetPoint } = getPoints(edge, nodesMap);

          const updatedLabels = edge.labels?.map((label) => ({
            ...label,
            position: getPointOnPath(edge.points || [], label.positionOnEdge),
          }));

          edgesToUpdate.push({
            id: edge.id,
            sourcePosition: sourcePoint || undefined,
            targetPosition: targetPoint || undefined,
            labels: updatedLabels,
          });
        }

        if (!shouldRoute) {
          return;
        }

        const { sourcePoint, targetPoint, points } = getPoints(edge, nodesMap, metadata?.routingConfiguration);
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
        zIndex: temporaryEdgeZIndex,
      };
    }

    next({
      ...(edgesToUpdate.length > 0 ? { edgesToUpdate } : {}),
      ...(newTemporaryEdge ? { metadataUpdate: { temporaryEdge: newTemporaryEdge } } : {}),
    });
  },
};
