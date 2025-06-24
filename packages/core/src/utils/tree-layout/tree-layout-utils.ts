import { TreeNode } from '../../types/tree-layout.interface.ts';

/**
 * Determines whether the given node is a leaf
 * @param node - The node to check.
 * @returns True if the node has no children; otherwise, false.
 */
export const isLeafNode = (node: TreeNode) => !node.children || node.children.length === 0;

export const getNodeSize = (node: TreeNode) => node.size || { width: 0, height: 0 };

/**
 * Moves nodes in the group by the given delta vector
 * @param groupChildren - Array of tree nodes to shift
 * @param delta - Shift vector {x, y}
 */
export const groupLayout = (groupChildren: TreeNode[], delta: { x: number; y: number }) => {
  for (const child of groupChildren) {
    child.position.x += delta.x;
    child.position.y += delta.y;
    if (child.groupChildren) {
      groupLayout(child.groupChildren, delta);
    }
  }
};
