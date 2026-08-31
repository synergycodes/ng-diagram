import { FlowStateUpdate, Middleware } from '../../../types';
import { computeHiddenNodeIds, isEdgeEffectivelyHidden } from '../../../visibility/effective-visibility';
import type { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';

/** Node property changes that can alter effective visibility. */
const HIDDEN_RELEVANT_NODE_PROPS = ['hidden', 'groupId'];
/** Edge property changes that can alter effective visibility. */
const HIDDEN_RELEVANT_EDGE_PROPS = ['hidden', 'source', 'target'];

export interface HiddenComputationOptions {
  /** Distinct middleware name for the pre-pass and finalize instances. */
  name: string;
  /**
   * When true, entries of removed nodes/edges are dropped from the
   * {@link TemplateVisibilityRegistry} (silently — the elements are gone, no
   * recompute pass is needed for them). Enabled on the pre-pass instance only.
   */
  cleanupRemovedEntries?: boolean;
  /**
   * Invoked when the pass actually changed some element's effective
   * visibility. Consumers that cache render output keyed on things that do
   * not change on a visibility toggle (e.g. the virtualized result cache)
   * use it as an O(1) invalidation signal.
   */
  onVisibilityChanged?: () => void;
}

/**
 * Stamps the system-computed `computedHidden` property on nodes and edges.
 *
 * A node is effectively hidden when its own `hidden` flag (or template-level
 * hidden binding, read from the {@link TemplateVisibilityRegistry}) is set or
 * any ancestor group is effectively hidden. An edge is effectively hidden
 * when its own flag/binding is set or either endpoint node is effectively
 * hidden. Every downstream consumer (rendering, spatial hash, selection,
 * routing, bounds, virtualization) reads `computedHidden` — never raw flags.
 *
 * The middleware runs TWICE per pass, as two instances:
 * - a **pre-pass** instance before the whole chain, so same-pass consumers
 *   (edges-routing, user middlewares, the built-in tail) see fresh effective
 *   visibility for changes carried by the initial update;
 * - a **finalize** instance at the start of the internal tail, so writes made
 *   by user middlewares (`hidden`, `groupId`, `source`, `target`) are also
 *   stamped within the same pass, and stamps on ADDED elements survive
 *   middlewares that re-emit `nodesToAdd`/`edgesToAdd` from the initial
 *   update (e.g. internal-id-assignment).
 *
 * The recompute is idempotent and diff-based: when the pre-pass already
 * stamped everything, the finalize instance emits nothing.
 *
 * @internal
 */
export const createHiddenComputationMiddleware = (
  registry: TemplateVisibilityRegistry,
  { name, cleanupRemovedEntries = false, onVisibilityChanged }: HiddenComputationOptions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Middleware<any> => ({
  name,
  execute: (context, next) => {
    const { state, modelActionTypes, helpers } = context;

    // Elements removed from the model take their template-hidden declarations
    // with them — otherwise a later element reusing the id would be silently
    // hidden by a stale entry.
    if (cleanupRemovedEntries) {
      if (helpers.anyNodesRemoved()) {
        for (const node of helpers.getRemovedNodes()) {
          registry.removeNodeEntries(node.id);
        }
      }
      if (helpers.anyEdgesRemoved()) {
        for (const edge of helpers.getRemovedEdges()) {
          registry.removeEdgeEntries(edge.id);
        }
      }
    }

    const shouldRecompute =
      modelActionTypes.includes('init') ||
      modelActionTypes.includes('templateVisibilityChange') ||
      helpers.anyNodesAdded() ||
      // Removing a group can unhide its former descendants.
      helpers.anyNodesRemoved() ||
      helpers.anyEdgesAdded() ||
      helpers.checkIfAnyNodePropsChanged(HIDDEN_RELEVANT_NODE_PROPS) ||
      helpers.checkIfAnyEdgePropsChanged(HIDDEN_RELEVANT_EDGE_PROPS);

    if (!shouldRecompute) {
      next();
      return;
    }

    const hiddenNodeIds = computeHiddenNodeIds(state.nodes, registry);
    const addedNodeIds = new Set(helpers.getAddedNodes().map((node) => node.id));
    const addedEdgeIds = new Set(helpers.getAddedEdges().map((edge) => edge.id));

    const nodesToAdd: FlowStateUpdate['nodesToAdd'] = [];
    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
    for (const node of state.nodes) {
      const hidden = hiddenNodeIds.has(node.id);
      if (hidden === (node.computedHidden ?? false)) continue;

      if (addedNodeIds.has(node.id)) {
        nodesToAdd.push({ ...node, computedHidden: hidden });
      } else {
        nodesToUpdate.push({ id: node.id, computedHidden: hidden });
      }
    }

    const edgesToAdd: FlowStateUpdate['edgesToAdd'] = [];
    const edgesToUpdate: FlowStateUpdate['edgesToUpdate'] = [];
    for (const edge of state.edges) {
      const hidden = isEdgeEffectivelyHidden(edge, hiddenNodeIds, registry);
      if (hidden === (edge.computedHidden ?? false)) continue;

      if (addedEdgeIds.has(edge.id)) {
        edgesToAdd.push({ ...edge, computedHidden: hidden });
      } else {
        edgesToUpdate.push({ id: edge.id, computedHidden: hidden });
      }
    }

    if (nodesToAdd.length || nodesToUpdate.length || edgesToAdd.length || edgesToUpdate.length) {
      onVisibilityChanged?.();
    }

    next({
      ...(nodesToAdd.length ? { nodesToAdd } : {}),
      ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
      ...(edgesToAdd.length ? { edgesToAdd } : {}),
      ...(edgesToUpdate.length ? { edgesToUpdate } : {}),
    });
  },
});
