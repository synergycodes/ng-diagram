import { TreeLayoutConfig, TreeNode } from '../../types/tree-layout.interface.ts';
import { getDirectionVectors, isAngleHorizontal } from '../get-direction.ts';
import { getNodeSize, getSizeAlongAxis, groupLayout, isLeafNode } from './tree-layout-utils.ts';

type Rect = { minX: number; maxX: number; minY: number; maxY: number };


/**
 * Calculates horizontal positions for a tree layout starting from the given parent node.
 *
 * @param parentNode
 * @param config
 * @param offsetX
 * @param offsetY
 * @returns {number}
 */
export const makeTreeLayout = (
  parentNode: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number,
  isRoot?: boolean
): Rect => {
  const { children } = parentNode;
  // Dimensions and direction
  const { width, height } = getNodeSize(parentNode);

  // Leaf node and groups: set X, Y and return
  if (isLeafNode(parentNode)) {
    if (parentNode.type === 'group') {
      const delta = { x: offsetX - parentNode.position.x, y: offsetY - parentNode.position.y };
      if (parentNode.groupChildren) groupLayout(parentNode.groupChildren, delta);
    }
    parentNode.position.x = offsetX;
    parentNode.position.y = offsetY;
    return {
      minX: offsetX,
      maxX: offsetX + width,
      minY: offsetY,
      maxY: offsetY + height,
    };
  }

  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;

  const { main, cross } = getDirectionVectors(parentAngle);
  // crossPos starts at 0, children will be laid out starting exactly at parent's cross position
  let crossPos = 0;

  let minX = offsetX;
  let maxX = offsetX + width;
  let minY = offsetY;
  let maxY = offsetY + height;

  console.log('PARENt', parentNode);
  console.log('CHILDREN', children);
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const { width: childWidth, height: childHeight } = getNodeSize(child);

    const parentSizeAlongMain = getSizeAlongAxis(width, height, main);
    const childSizeAlongMain = getSizeAlongAxis(childWidth, childHeight, main);

    // Determine whether you are drawing "forward" (0 or 90) or "backward" (180 or 270)
    const drawForward = main.x > 0 || main.y > 0;

    // Calculate the offset relative to the main axis
    const offsetMain = config.levelGap + (drawForward ? parentSizeAlongMain : childSizeAlongMain);

    // Child’s position relative to the parent
    const childPos = {
      x: offsetX + main.x * offsetMain + cross.x * crossPos,
      y: offsetY + main.y * offsetMain + cross.y * crossPos,
    };

    // Recursively arrange the subtree
    const childBounds = makeTreeLayout(child, config, childPos.x, childPos.y);

    // Update the boundaries of the entire subtree
    minX = Math.min(minX, childBounds.minX);
    maxX = Math.max(maxX, childBounds.maxX);
    minY = Math.min(minY, childBounds.minY);
    maxY = Math.max(maxY, childBounds.maxY);

    // Calculate the size of the entire child subtree along the cross axis
    const childSubtreeCrossSize = getSizeAlongAxis(
      Math.abs(childBounds.maxX - childBounds.minX),
      Math.abs(childBounds.maxY - childBounds.minY),
      cross
    );

    // Move along the cross-axis, taking into account the size of the child subtree and the spacing
    crossPos += childSubtreeCrossSize + (i < children.length - 1 ? config.siblingGap : 0);
  }
  const [firstChild, lastChild] = [children[0], children[children.length - 1]];
  const isHorizontal = isAngleHorizontal(parentAngle);

  let x, y;

  if (config.layoutAlignment === 'Start') {
    x = offsetX;
    y = offsetY;
  } else if (config.layoutAlignment === 'Subtree') {
    x = !isHorizontal ? (minX + maxX - width) / 2 : offsetX;
    y = isHorizontal ? (minY + maxY - height) / 2 : offsetY;
  } else {
    x = !isHorizontal
      ? (firstChild.position.x + lastChild.position.x + (lastChild.size?.width || 0) - width) / 2
      : offsetX;
    y = isHorizontal
      ? (firstChild.position.y + lastChild.position.y + (lastChild.size?.height || 0) - height) / 2
      : offsetY;
  }

  if (parentNode.type === 'group') {
    const delta = { x: x - parentNode.position.x, y: y - parentNode.position.y };
    if (parentNode.groupChildren) groupLayout(parentNode.groupChildren, delta);
  }
  parentNode.position.x = x;
  parentNode.position.y = y;

  return { minX, maxX, minY, maxY };
};
