import type { Edge, EdgeEnd } from '../types/edge.interface';
import type { Node } from '../types/node.interface';
import type { Point } from '../types/utils';
import { getPortFlowPosition } from './get-port-flow-position';

/**
 * One free (unconnected) endpoint of a dangling edge.
 *
 * @public
 * @since 1.4.0
 * @category Types/Model
 */
export interface DanglingEndpoint {
  /** The dangling edge. */
  edge: Edge;
  /** Which endpoint of the edge is free. */
  end: EdgeEnd;
  /** The position the free endpoint is anchored at. */
  position: Point;
}

/**
 * Checks whether the given endpoint of an edge is free (not connected to a
 * node). A free endpoint is represented by an empty `source`/`target` with the
 * position stored in `sourcePosition`/`targetPosition`.
 *
 * When `end` is omitted, checks whether either endpoint is free.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const hasFreeEndpoint = (edge: Edge, end?: EdgeEnd): boolean => {
  if (end === 'source') {
    return !edge.source;
  }
  if (end === 'target') {
    return !edge.target;
  }
  return !edge.source || !edge.target;
};

/**
 * Checks whether an edge is dangling — has at least one endpoint not connected
 * to a node. An edge with both endpoints free is a dual dangling edge.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const isDanglingEdge = (edge: Edge): boolean => hasFreeEndpoint(edge);

/**
 * Collects the free endpoints of the given edges. A dual dangling edge yields
 * two entries. Endpoints whose anchor position is missing are skipped —
 * they cannot be rendered or snapped to. Temporary and effectively hidden
 * edges are skipped.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const getDanglingEndpoints = (edges: readonly Edge[]): DanglingEndpoint[] => {
  const endpoints: DanglingEndpoint[] = [];
  for (const edge of edges) {
    if (edge.temporary || edge.computedHidden) {
      continue;
    }
    if (!edge.source && edge.sourcePosition) {
      endpoints.push({ edge, end: 'source', position: edge.sourcePosition });
    }
    if (!edge.target && edge.targetPosition) {
      endpoints.push({ edge, end: 'target', position: edge.targetPosition });
    }
  }
  return endpoints;
};

/**
 * Computes the anchor a detached endpoint stays at: the port's current flow
 * position when the edge was connected to a port, the edge's routed endpoint
 * otherwise, the node's center as a last resort. Must run while the node is
 * still in the state.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const computeDetachAnchor = (edge: Edge, end: EdgeEnd, node: Node | null | undefined): Point | null => {
  const portId = end === 'source' ? edge.sourcePort : edge.targetPort;
  if (node && portId) {
    const portPosition = getPortFlowPosition(node, portId);
    if (portPosition) {
      return portPosition;
    }
  }
  const points = edge.points;
  if (points && points.length > 0) {
    return end === 'source' ? points[0] : points[points.length - 1];
  }
  if (node) {
    return {
      x: node.position.x + (node.size?.width ?? 0) / 2,
      y: node.position.y + (node.size?.height ?? 0) / 2,
    };
  }
  return null;
};

/**
 * For a manual-routing edge, returns a `points` patch with the given end's
 * point moved to `anchor`, keeping the stored path aligned with the new
 * endpoint — the routing middleware keeps manual points verbatim, so without
 * this the drawn path would still end at the old endpoint.
 * Returns an empty patch for auto-routed edges (they re-route on their own).
 *
 * @internal
 */
export const alignManualPointsPatch = (edge: Edge, end: EdgeEnd, anchor: Point): Partial<Edge> => {
  if (edge.routingMode !== 'manual' || !edge.points || edge.points.length === 0) {
    return {};
  }
  const points = edge.points.map((point) => ({ ...point }));
  points[end === 'source' ? 0 : points.length - 1] = { x: anchor.x, y: anchor.y };
  return { points };
};

/**
 * Finds the free edge endpoint nearest to `point` within `range`, or null when
 * none is close enough. Sibling of `getNearestPortInRange` for snapping to
 * dangling ends. Temporary and effectively hidden edges are skipped.
 *
 * @public
 * @since 1.4.0
 * @category Utilities
 */
export const getNearestDanglingEndpointInRange = (
  edges: readonly Edge[],
  point: Point,
  range: number
): DanglingEndpoint | null => {
  // Single allocation-free scan (this runs in pointermove handlers): only the
  // winning endpoint materializes an object.
  let bestEdge: Edge | null = null;
  let bestEnd: EdgeEnd = 'source';
  let bestPosition: Point | null = null;
  let bestDistSq = range * range;

  const consider = (edge: Edge, end: EdgeEnd, position: Point | undefined) => {
    if (!position) {
      return;
    }
    const dx = position.x - point.x;
    const dy = position.y - point.y;
    const distSq = dx * dx + dy * dy;
    if (distSq <= bestDistSq) {
      bestDistSq = distSq;
      bestEdge = edge;
      bestEnd = end;
      bestPosition = position;
    }
  };

  for (const edge of edges) {
    if (edge.temporary || edge.computedHidden) {
      continue;
    }
    if (!edge.source) {
      consider(edge, 'source', edge.sourcePosition);
    }
    if (!edge.target) {
      consider(edge, 'target', edge.targetPosition);
    }
  }

  return bestEdge && bestPosition ? { edge: bestEdge, end: bestEnd, position: bestPosition } : null;
};
