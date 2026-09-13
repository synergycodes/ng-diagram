import type { FlowCore } from '../../flow-core';
import type { Node } from '../../types';

/**
 * Selected nodes (with their descendants) eligible for interactive movement —
 * shared by pointer drag and keyboard move.
 *
 * Effectively hidden elements cannot be moved through their own selection: a
 * still-selected hidden node must not shift while invisible. Hidden
 * descendants of a visible moved ancestor are the exception — they travel
 * with it (e.g. the hidden children of a dragged collapsed group), otherwise
 * unhiding would reveal them left behind outside the group.
 *
 * Ancestry is resolved through the same descendants map that builds the
 * selection set (plain `groupId` links, no `isGroup` enforcement) — NOT via
 * `getParentChain`, which enforces `isGroup`, logs model-integrity errors on
 * violations (per pointermove frame during a drag), and would strand hidden
 * children that effective visibility considers covered.
 */
/**
 * Whether an arrow key would actually move something — the single predicate
 * MovingAction gates on and PanningAction negates, so the two stay exact
 * complements: any selection the move handler would no-op on (dragging
 * disabled, only hidden nodes, only `draggable: false` nodes) must not
 * swallow the arrow keys; they fall through to viewport panning instead.
 */
export const hasMovableSelection = (flow: FlowCore): boolean =>
  flow.config.nodeDraggingEnabled && getMovableSelection(flow).length > 0;

export const getMovableSelection = (flow: FlowCore): Node[] => {
  const selectedWithChildren = flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });

  // Roots that actually move: selected, visible and draggable.
  const movingRoots = selectedWithChildren.filter(
    (node) => node.selected && !node.computedHidden && (node.draggable ?? true)
  );

  const hasHidden = selectedWithChildren.some((node) => node.computedHidden);
  if (!hasHidden) {
    return selectedWithChildren.filter((node) => node.draggable ?? true);
  }

  // Every descendant of a moving root travels with it, hidden or not.
  const coveredByMovingRoots = new Set<string>();
  for (const root of movingRoots) {
    for (const descendantId of flow.modelLookup.getAllDescendantIds(root.id)) {
      coveredByMovingRoots.add(descendantId);
    }
  }

  return selectedWithChildren.filter((node) => {
    if (!(node.draggable ?? true)) return false;
    if (!node.computedHidden) return true;
    return coveredByMovingRoots.has(node.id);
  });
};
