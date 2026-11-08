import type { FlowCore } from '../../flow-core';
import type { Node } from '../../types';

/**
 * Selected nodes (with their descendants) eligible for interactive movement —
 * shared by pointer drag and keyboard move.
 *
 * A node whose parent is in the set follows its parent, whatever its own
 * `draggable`. A node at the top of its chain (its parent is not in the set)
 * moves only when it is draggable and visible:
 * - `draggable: false` only blocks a move that starts from that node: a
 *   selected non-draggable group keeps its whole subtree in place, visible
 *   and hidden, also when some of its descendants are selected, while a
 *   non-draggable node inside a moving group moves with it.
 * - Effectively hidden elements cannot be moved through their own selection:
 *   a still-selected hidden node must not shift while invisible. Hidden
 *   descendants of a visible moved ancestor travel with it (e.g. the hidden
 *   children of a dragged collapsed group), otherwise unhiding would reveal
 *   them left behind outside the group.
 * - A child selected without its non-draggable group tops its own chain, so
 *   it still moves.
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

    const parent = node.groupId ? nodesById.get(node.groupId) : undefined;
    const result = parent ? moves(parent) : node.draggable !== false && !node.computedHidden;

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

/**
 * Whether a drag that starts from the pressed node would move it. A selected node follows the rule of
 * `getMovableSelection`. An unselected node becomes the selection on press, so it moves when it is draggable.
 */
export const movesOnPress = (flow: FlowCore, node: Node): boolean =>
  node.selected ? getMovableSelection(flow).some(({ id }) => id === node.id) : node.draggable !== false;
