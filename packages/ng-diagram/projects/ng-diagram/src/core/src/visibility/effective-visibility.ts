import type { Edge, Node } from '../types';
import type { TemplateVisibilityRegistry } from './template-visibility-registry';

/**
 * A node is hidden at the raw level when its own model flag is set or a
 * template-level hidden binding declared it hidden.
 *
 * @internal
 */
export const isNodeRawHidden = (node: Node, registry?: TemplateVisibilityRegistry): boolean =>
  node.hidden === true || (registry?.isNodeHidden(node.id) ?? false);

/**
 * An edge is hidden at the raw level when its own model flag is set or a
 * template-level hidden binding declared it hidden.
 *
 * @internal
 */
export const isEdgeRawHidden = (edge: Edge, registry?: TemplateVisibilityRegistry): boolean =>
  edge.hidden === true || (registry?.isEdgeHidden(edge.id) ?? false);

/**
 * Computes the set of effectively hidden node ids: a node is effectively
 * hidden when its own raw flag is set or any ancestor group is effectively
 * hidden. A missing or cyclic parent chain never hides a node.
 *
 * @internal
 */
export const computeHiddenNodeIds = (nodes: Node[], registry?: TemplateVisibilityRegistry): Set<string> => {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const memo = new Map<string, boolean>();

  const resolve = (node: Node, visiting: Set<string>): boolean => {
    const cached = memo.get(node.id);
    if (cached !== undefined) return cached;
    // Cycle guard: a corrupted groupId cycle must not loop forever.
    if (visiting.has(node.id)) return false;
    visiting.add(node.id);

    const parent = node.groupId ? nodesById.get(node.groupId) : undefined;
    const hidden = isNodeRawHidden(node, registry) || (parent ? resolve(parent, visiting) : false);

    memo.set(node.id, hidden);
    return hidden;
  };

  const hiddenIds = new Set<string>();
  for (const node of nodes) {
    if (resolve(node, new Set())) {
      hiddenIds.add(node.id);
    }
  }
  return hiddenIds;
};

/**
 * An edge is effectively hidden when its own raw flag is set or either
 * endpoint node is effectively hidden.
 *
 * @internal
 */
export const isEdgeEffectivelyHidden = (
  edge: Edge,
  hiddenNodeIds: Set<string>,
  registry?: TemplateVisibilityRegistry
): boolean => isEdgeRawHidden(edge, registry) || hiddenNodeIds.has(edge.source) || hiddenNodeIds.has(edge.target);
