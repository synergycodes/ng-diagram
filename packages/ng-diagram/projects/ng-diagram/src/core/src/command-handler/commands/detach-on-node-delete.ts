import type { FlowCore } from '../../flow-core';
import type { Edge, EdgeEnd } from '../../types';
import { alignManualPointsPatch, computeDetachAnchor } from '../../utils';
import { isEdgeRawHidden } from '../../visibility/effective-visibility';

/**
 * How the edges incident to a set of deleted nodes are handled: removed along
 * with the nodes (the default), or detached into dangling edges.
 */
export interface IncidentEdgesPartition {
  edgesToRemove: string[];
  edgesToUpdate: (Partial<Edge> & { id: string })[];
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
 * - it is hidden only through the node(s) it loses (e.g. the collapsed
 *   children of a deleted group) — detaching would materialize invisible
 *   wiring as a visible dangling edge; an edge that stays hidden on its own
 *   (its `hidden` flag, a template binding, a hidden surviving endpoint)
 *   detaches like any other, or
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
  const edgesToUpdate: (Partial<Edge> & { id: string })[] = [];

  const mayDetach = (edge: Edge, end: EdgeEnd, nodeId: string): boolean => {
    const node = flowCore.getNodeById(nodeId);
    if (!node) {
      return false;
    }
    if (!danglingEdges?.shouldDetachOnNodeDelete) {
      return true;
    }
    return danglingEdges.shouldDetachOnNodeDelete(edge, node, end);
  };

  // A hidden edge is deleted only when the detach would make it visible: it is
  // hidden through the node(s) it loses and nothing else keeps it hidden (own
  // `hidden` flag, template binding, hidden surviving endpoint). That is the
  // invisible wiring of e.g. a deleted collapsed group, which must not
  // reappear as a dangling edge. An edge that stays hidden detaches like a
  // visible one — hiding is not a reason to lose wiring the user kept.
  const wouldBecomeVisible = (edge: Edge, sourceLost: boolean, targetLost: boolean): boolean => {
    if (!edge.computedHidden || isEdgeRawHidden(edge, flowCore.templateVisibilityRegistry)) {
      return false;
    }
    const survivingNodeId = sourceLost && targetLost ? '' : sourceLost ? edge.target : edge.source;
    return !(survivingNodeId && flowCore.getNodeById(survivingNodeId)?.computedHidden);
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
      wouldBecomeVisible(edge, sourceLost, targetLost) ||
      dualWithoutOptIn
    ) {
      edgesToRemove.push(edge.id);
      continue;
    }

    // Both decisions are computed eagerly: the callback sees every end this
    // edge loses, so an app can count or log them per end without a
    // short-circuit hiding the second call.
    const sourceOk = !sourceLost || mayDetach(edge, 'source', edge.source);
    const targetOk = !targetLost || mayDetach(edge, 'target', edge.target);
    if (!sourceOk || !targetOk) {
      edgesToRemove.push(edge.id);
      continue;
    }

    let update: Partial<Edge> & { id: string } = { id: edge.id };
    if (sourceLost) {
      const anchor = computeDetachAnchor(edge, 'source', flowCore.getNodeById(edge.source));
      if (!anchor) {
        edgesToRemove.push(edge.id);
        continue;
      }
      update = {
        ...update,
        source: '',
        sourcePort: undefined,
        sourcePosition: anchor,
        ...alignManualPointsPatch(edge, 'source', anchor),
      };
    }
    if (targetLost) {
      const anchor = computeDetachAnchor(edge, 'target', flowCore.getNodeById(edge.target));
      if (!anchor) {
        edgesToRemove.push(edge.id);
        continue;
      }
      // Built on the patch above so an edge losing both ends keeps points[0].
      update = {
        ...update,
        target: '',
        targetPort: undefined,
        targetPosition: anchor,
        ...alignManualPointsPatch({ ...edge, ...update }, 'target', anchor),
      };
    }
    edgesToUpdate.push(update);
  }

  return { edgesToRemove, edgesToUpdate };
};
