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
 */
export const getMovableSelection = (flow: FlowCore): Node[] => {
  const selectedWithChildren = flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });

  // Roots that actually move: selected, visible and draggable.
  const movingRootIds = new Set(
    selectedWithChildren
      .filter((node) => node.selected && !node.computedHidden && (node.draggable ?? true))
      .map((node) => node.id)
  );

  return selectedWithChildren.filter((node) => {
    if (!(node.draggable ?? true)) return false;
    if (!node.computedHidden) return true;
    // Hidden node: moves only as a descendant of a moving visible ancestor.
    return flow.modelLookup.getParentChain(node.id).some((ancestor) => movingRootIds.has(ancestor.id));
  });
};
