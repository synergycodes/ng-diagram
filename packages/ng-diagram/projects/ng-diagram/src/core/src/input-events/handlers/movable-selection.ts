import type { FlowCore } from '../../flow-core';
import type { Node } from '../../types';

/**
 * Selected nodes (with their descendants) eligible for interactive movement —
 * shared by pointer drag and keyboard move.
 *
 * A node moves only when it and every ancestor inside the moved set are
 * draggable, and the top of its chain inside the set is visible:
 * - A non-draggable node, group or not, keeps its whole subtree in place
 *   whenever it is part of the moved set, so its visible and hidden
 *   descendants behave the same (also when they are selected themselves).
 * - Effectively hidden elements cannot be moved through their own selection:
 *   a still-selected hidden node must not shift while invisible. Hidden
 *   descendants of a visible moved ancestor travel with it (e.g. the hidden
 *   children of a dragged collapsed group), otherwise unhiding would reveal
 *   them left behind outside the group.
 * - A node whose parent is not in the set tops its own chain, so a child
 *   selected without its non-draggable group still moves.
 *
 * Ancestry is resolved through the raw `groupId` links of the set itself, the
 * same links that build the selection set (no `isGroup` enforcement) — NOT via
 * `getParentChain`, which enforces `isGroup`, logs model-integrity errors on
 * violations (per pointermove frame during a drag), and would strand hidden
 * children that effective visibility considers covered.
 */
export const getMovableSelection = (flow: FlowCore): Node[] => {
  const selectedWithChildren = flow.modelLookup.getSelectedNodesWithChildren({ directOnly: false });
  const nodesById = new Map(selectedWithChildren.map((node) => [node.id, node]));
  const movesById = new Map<string, boolean>();

  const moves = (node: Node): boolean => {
    const known = movesById.get(node.id);
    if (known !== undefined) return known;

    // Seeded before recursing, so a groupId cycle or self-link ends without moving.
    movesById.set(node.id, false);

    let result: boolean;
    if (node.draggable === false) {
      result = false;
    } else {
      const parent = node.groupId ? nodesById.get(node.groupId) : undefined;
      result = parent ? moves(parent) : !node.computedHidden;
    }

    movesById.set(node.id, result);
    return result;
  };

  return selectedWithChildren.filter(moves);
};

/**
 * Whether an arrow key would move something: node dragging is enabled and the selection has at least one
 * movable node. When this is true, the arrow keys move the selection. When it is false, they pan the viewport.
 */
export const hasMovableSelection = (flow: FlowCore): boolean =>
  flow.config.nodeDraggingEnabled && getMovableSelection(flow).length > 0;
