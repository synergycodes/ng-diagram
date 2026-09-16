import type { FlowCore } from '../../flow-core';
import type { Edge, EdgeEnd } from '../../types';
import { computeDetachAnchor } from '../../utils';

/**
 * How the edges incident to a set of deleted nodes are handled: removed along
 * with the nodes (the default), or detached into dangling edges.
 */
export interface IncidentEdgesPartition {
  edgesToRemove: string[];
  edgesToUpdate: (Partial<Edge> & { id: Edge['id'] })[];
}

/**
 * Partitions the edges incident to the nodes being deleted into edges to
 * delete and edges to detach into dangling edges.
 *
 * With `danglingEdges.enabled` + `danglingEdges.detachOnNodeDelete` off, every
 * incident edge is deleted — the pre-existing cascade behavior. With them on,
 * an incident edge is detached (its lost endpoint becomes free, anchored where
 * its port was) unless:
 * - it is part of `explicitlyDeletedEdgeIds` (e.g. selected in a
 *   deleteSelection) — an explicit delete always wins, or
 * - the edge itself or the lost endpoint's node is effectively hidden —
 *   detaching would materialize invisible wiring (e.g. the collapsed children
 *   of a deleted group) as visible dangling edges, or
 * - `shouldDetachOnNodeDelete` returns false for any endpoint being lost —
 *   then the whole edge is deleted, or
 * - the edge loses BOTH endpoints in the same cascade — such an edge is
 *   deleted by default (detaching would leave dual-dangling debris at the
 *   deleted nodes' old positions); it becomes a dual dangling edge only when
 *   `shouldDetachOnNodeDelete` is defined and returns true for both ends.
 */
export const partitionIncidentEdges = (
  flowCore: FlowCore,
  edges: Edge[],
  nodesToDeleteIds: Set<string>,
  explicitlyDeletedEdgeIds?: Set<string>
): IncidentEdgesPartition => {
  const danglingEdges = flowCore.config.danglingEdges;
  const detachEnabled = !!danglingEdges?.enabled && !!danglingEdges.detachOnNodeDelete;

  const edgesToRemove: string[] = [];
  const edgesToUpdate: (Partial<Edge> & { id: Edge['id'] })[] = [];

  const mayDetach = (edge: Edge, end: EdgeEnd, nodeId: string): boolean => {
    const node = flowCore.getNodeById(nodeId);
    // A hidden lost endpoint must not demote its (hidden) edge into a visible
    // dangling edge.
    if (!node || node.computedHidden) {
      return false;
    }
    if (!danglingEdges?.shouldDetachOnNodeDelete) {
      return true;
    }
    return danglingEdges.shouldDetachOnNodeDelete(edge, node, end);
  };

  for (const edge of edges) {
    const sourceLost = nodesToDeleteIds.has(edge.source);
    const targetLost = nodesToDeleteIds.has(edge.target);
    if (!sourceLost && !targetLost) {
      continue;
    }

    // An edge losing both ends is deleted unless the app opted into dual
    // dangling explicitly through the callback.
    const dualWithoutOptIn = sourceLost && targetLost && !danglingEdges?.shouldDetachOnNodeDelete;

    if (
      !detachEnabled ||
      explicitlyDeletedEdgeIds?.has(edge.id) ||
      edge.computedHidden ||
      dualWithoutOptIn ||
      (sourceLost && !mayDetach(edge, 'source', edge.source)) ||
      (targetLost && !mayDetach(edge, 'target', edge.target))
    ) {
      edgesToRemove.push(edge.id);
      continue;
    }

    const update: Partial<Edge> & { id: Edge['id'] } = { id: edge.id };
    if (sourceLost) {
      const anchor = computeDetachAnchor(edge, 'source', flowCore.getNodeById(edge.source));
      if (!anchor) {
        edgesToRemove.push(edge.id);
        continue;
      }
      update.source = '';
      update.sourcePort = undefined;
      update.sourcePosition = anchor;
    }
    if (targetLost) {
      const anchor = computeDetachAnchor(edge, 'target', flowCore.getNodeById(edge.target));
      if (!anchor) {
        edgesToRemove.push(edge.id);
        continue;
      }
      update.target = '';
      update.targetPort = undefined;
      update.targetPosition = anchor;
    }
    edgesToUpdate.push(update);
  }

  return { edgesToRemove, edgesToUpdate };
};
