import { TreeLayoutConfig, TreeNode } from '../types/tree-layout.interface.ts';

/**
 * Calculates horizontal positions for a tree layout starting from the given parent node.
 *
 * @param parentNode
 * @param config
 * @param offsetX
 * @param offsetY
 * @returns {number}
 */
export const horizontalTreeLayout = (
  parentNode: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number
): number => {
  const { children } = parentNode;

  let currentOffsetY = offsetY;

  parentNode.position.x = offsetX;

  if (!children.length) {
    parentNode.position.y = (offsetY + currentOffsetY) / 2;
    return currentOffsetY;
  }

  const parentWidth = parentNode.size?.width || 0;
  const newLevelX = offsetX + parentWidth + config.levelGap;
  const parentHeight = parentNode.size?.height || 0;

  let childOffsetY = offsetY;

  children.forEach((child, i) => {
    const childHeight = child.size?.height || 0;
    const childY = horizontalTreeLayout(child, config, newLevelX, childOffsetY);
    currentOffsetY = childY + (child.children.length > 0 ? 0 : childHeight);
    childOffsetY = currentOffsetY + (i < children.length - 1 ? config.siblingGap : 0);
  });

  const topOffsetY = Math.min(children[0].position.y, offsetY);
  parentNode.position.y = (topOffsetY + currentOffsetY - parentHeight) / 2;

  return currentOffsetY;
};

/**
 * Calculates vertical positions for a tree layout starting from the given parent node.
 *
 * @param parentNode
 * @param config
 * @param offsetX
 * @param offsetY
 * @returns number
 */
export const verticalTreeLayout = (
  parentNode: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number
): number => {
  const { children } = parentNode;

  let currentOffsetX = offsetX;

  parentNode.position.y = offsetY;

  if (!children.length) {
    parentNode.position.x = (offsetX + currentOffsetX) / 2;
    return currentOffsetX;
  }

  const parentHeight = parentNode.size?.height || 0;
  const newLevelY = offsetY + parentHeight + config.levelGap;
  const parentWidth = parentNode.size?.width || 0;

  let childOffsetX = offsetX;

  children.forEach((child, i) => {
    const childWidth = child.size?.width || 0;
    const childX = verticalTreeLayout(child, config, childOffsetX, newLevelY);
    currentOffsetX = childX + (child.children.length > 0 ? 0 : childWidth);
    childOffsetX = currentOffsetX + (i < children.length - 1 ? config.siblingGap : 0);
  });

  const topOffsetX = Math.min(children[0].position.x, offsetX);
  parentNode.position.x = (topOffsetX + currentOffsetX - parentWidth) / 2;

  return currentOffsetX;
};
