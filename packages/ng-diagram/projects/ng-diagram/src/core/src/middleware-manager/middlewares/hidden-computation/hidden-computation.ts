import { FlowStateUpdate, Middleware } from '../../../types';
import { computeHiddenNodeIds, isEdgeEffectivelyHidden } from '../../../visibility/effective-visibility';
import type { TemplateVisibilityRegistry } from '../../../visibility/template-visibility-registry';

/** Node property changes that can alter effective visibility. */
const HIDDEN_RELEVANT_NODE_PROPS = ['hidden', 'groupId'];
/** Edge property changes that can alter effective visibility. */
const HIDDEN_RELEVANT_EDGE_PROPS = ['hidden', 'source', 'target'];

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
 * Runs before all user middlewares so they and the built-in tail see fresh
 * effective visibility within the same pass.
 *
 * @internal
 */
export const createHiddenComputationMiddleware = (
  registry: TemplateVisibilityRegistry
): Middleware<'hidden-computation'> => ({
  name: 'hidden-computation',
  execute: (context, next) => {
    const { state, modelActionTypes, helpers } = context;

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

    next({
      ...(nodesToAdd.length ? { nodesToAdd } : {}),
      ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
      ...(edgesToAdd.length ? { edgesToAdd } : {}),
      ...(edgesToUpdate.length ? { edgesToUpdate } : {}),
    });
  },
});
