import { LayoutAngleType, TreeNode, Rect } from '../../types/tree-layout.interface.ts';
import { getSign, isAngleVertical } from '../get-direction.ts';

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

/**
 * Moves a node and all its children by dx and dy.
 *
 * @param node - The root node to move.
 * @param dx - How much to move in the x direction.
 * @param dy - How much to move in the y direction.
 */
export const shiftSubtree = (node: TreeNode, dx: number, dy: number): void => {
  node.position.x += dx;
  node.position.y += dy;
  // Move all children, if any
  node.children?.forEach(child => shiftSubtree(child, dx, dy));
};


/**
 * Shifts children nodes to center and keep within offset bounds.
 *
 * @param parenNode - The parent node with children.
 * @param parentAngle - The angle of the parent layout.
 * @param parentOffset - The offset position of the parent.
 * @param childrenBounds - The bounding box of children.
 * @param grandparentAngle - The angle of the grandparent layout.
 */
export const maybeShiftChildren = (
  parenNode: TreeNode,
  parentAngle: LayoutAngleType,
  parentOffset: { x: number; y: number },
  childrenBounds: Rect,
  grandparentAngle: LayoutAngleType
): void => {
  const isVertical = isAngleVertical(parentAngle);

  // Skip if the parent is flipped and a layout direction matches grandparent
  if (getSign(parentAngle) === -1 && isAngleVertical(grandparentAngle) === isVertical) return;

  const { width, height } = getNodeSize(parenNode);
  const childrenWidth = childrenBounds.maxX - childrenBounds.minX;
  const childrenHeight = childrenBounds.maxY - childrenBounds.minY;

  let shiftX = 0,
    shiftY = 0;
  // Center children horizontally if needed
  if (isVertical && width > childrenWidth) {
    shiftX = (width - childrenWidth) / 2 + parentOffset.x - childrenBounds.minX;
  }
  // Center children vertically if needed
  else if (!isVertical && height > childrenHeight) {
    shiftY = (height - childrenHeight) / 2 + parentOffset.y - childrenBounds.minY;
  }

  // Move children if a shift is needed
  if (shiftX || shiftY) {
    for (const child of parenNode.children) {
      child.position.x += shiftX;
      child.position.y += shiftY;
    }
    childrenBounds.minX += shiftX;
    childrenBounds.maxX += shiftX;
    childrenBounds.minY += shiftY;
    childrenBounds.maxY += shiftY;
  }

  // Make sure children do not go past the parent's offset
  const deltaX = parentOffset.x - childrenBounds.minX;
  const deltaY = parentOffset.y - childrenBounds.minY;

  if (deltaX > 0 || deltaY > 0) {
    const shiftSubtree = (node: TreeNode) => {
      if (deltaX > 0) node.position.x += deltaX;
      if (deltaY > 0) node.position.y += deltaY;
      node.children?.forEach(shiftSubtree);
    };
    shiftSubtree(parenNode);

    if (deltaX > 0) {
      childrenBounds.minX += deltaX;
      childrenBounds.maxX += deltaX;
    }
    if (deltaY > 0) {
      childrenBounds.minY += deltaY;
      childrenBounds.maxY += deltaY;
    }
  }
};
