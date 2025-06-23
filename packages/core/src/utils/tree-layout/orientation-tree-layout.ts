import { TreeLayoutConfig, TreeNode } from '../../types/tree-layout.interface.ts';
import { getDirectionVectors, isAngleHorizontal } from '../get-direction.ts';
import { getNodeSize, groupLayout, isLeafNode } from './tree-layout-utils.ts';

type Rect = { minX: number; maxX: number; minY: number; maxY: number };

export function getSizeAlongAxis(width: number, height: number, axis: { x: number; y: number }): number {
  if (axis.x !== 0) return width;
  else return height;
}

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
  if (isLeafNode(parentNode) || parentNode.type === 'group') {
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

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    const { width: childWidth, height: childHeight } = getNodeSize(child);

    const parentSizeAlongMain = getSizeAlongAxis(width, height, main);
    const childSizeAlongMain = getSizeAlongAxis(childWidth, childHeight, main);

    // Determine whether you are drawing "forward" (0 or 90) or "backward" (180 or 270)
    const drawForward = main.x > 0 || main.y > 0;

    const offsetMain = config.levelGap + (drawForward ? parentSizeAlongMain : childSizeAlongMain);
    // const offsetMain = config.levelGap + getSizeAlongAxis(childWidth, childHeight, main);
    // Child position = parent position + main offset + cross-offset
    const childPos = {
      x: offsetX + main.x * offsetMain + cross.x * crossPos,
      y: offsetY + main.y * offsetMain + cross.y * crossPos,
    };

    const childBounds = makeTreeLayout(children[i], config, childPos.x, childPos.y);
    minX = Math.min(minX, childBounds.minX);
    maxX = Math.max(maxX, childBounds.maxX);
    minY = Math.min(minY, childBounds.minY);
    maxY = Math.max(maxY, childBounds.maxY);
    // Move crossPos by child size and gap to position next sibling
    crossPos += getSizeAlongAxis(childWidth, childHeight, cross) + (i < children.length - 1 ? config.siblingGap : 0);
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

  parentNode.position.x = x;
  parentNode.position.y = y;

  return { minX, maxX, minY, maxY };
};
