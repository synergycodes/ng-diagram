import { TreeLayoutConfig, TreeNode } from '../types';
import { getSign, isAngleHorizontal } from './get-direction.ts';

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
  parentNode.position.x = offsetX;

  // Leaf node: set X and return
  if (!children.length) {
    parentNode.position.y = offsetY;
    return offsetY;
  }

  // Dimensions and direction
  const { width: parentWidth = 0, height: parentHeight = 0 } = parentNode.size || {};
  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;
  const isHorizontal = isAngleHorizontal(parentAngle);
  const sign = getSign(parentAngle);

  // Offsets for children
  let childOffsetY = offsetY + (!isHorizontal ? parentHeight + config.levelGap : 0);
  let childOffsetX = offsetX;
  let currentOffsetY = offsetY;

  // Layout children
  children.forEach((child, i) => {
    const { width: childWidth = 0, height: childHeight = 0 } = child.size || {};
    const childX = sign === 1
      ? offsetX + parentWidth + config.levelGap
      : offsetX - (childWidth + config.levelGap);

    const childY = isHorizontal
      ? horizontalTreeLayout(child, config, childX, childOffsetY)
      : verticalTreeLayout(child, config, childOffsetX, childOffsetY);

    childOffsetX += childWidth + config.siblingGap;
    currentOffsetY = childY+ (child.children.length ? 0 : childHeight);

    if (isHorizontal) {
      childOffsetY = currentOffsetY + (i < children.length - 1 ? config.siblingGap : 0);
    }
  });

  // Parent X position based on alignment
  const [firstChild, lastChild] = [children[0], children[children.length - 1]];
  const topOffsetY = config.layoutAlignment === 'Subtree'
    ? Math.min(firstChild.position.y, offsetY)
    : firstChild.position.y;
  const bottomOffsetY = config.layoutAlignment === 'Subtree'
    ? Math.max(lastChild.position.y + (lastChild.size?.height|| 0), currentOffsetY)
    : lastChild.position.y + (lastChild.size?.height || 0);

  parentNode.position.y = !isHorizontal
    ? offsetY
    : (topOffsetY + bottomOffsetY - parentHeight) / 2;

  // Return updated offset
  const maxChildrenHeight = Math.max(...children.map(child => child.size?.height || 0));
  return !isHorizontal
    ? offsetY + maxChildrenHeight + parentHeight + config.levelGap
    : currentOffsetY;
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
  parentNode.position.y = offsetY;

  // Leaf node: set X and return
  if (!children.length) {
    parentNode.position.x = offsetX;
    return offsetX;
  }

  // Dimensions and direction
  const { width: parentWidth = 0, height: parentHeight = 0 } = parentNode.size || {};
  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;
  const isHorizontal = isAngleHorizontal(parentAngle);
  const sign = getSign(parentAngle);

  // Offsets for children
  let childOffsetX = offsetX + (isHorizontal ? parentWidth + config.levelGap : 0);
  let childOffsetY = offsetY;
  let currentOffsetX = offsetX;

  // Layout children
  children.forEach((child, i) => {
    const { width: childWidth = 0, height: childHeight = 0 } = child.size || {};
    const childY = sign === 1
      ? offsetY + parentHeight + config.levelGap
      : offsetY - (childHeight + config.levelGap);

    const childX = isHorizontal
      ? horizontalTreeLayout(child, config, childOffsetX, childOffsetY)
      : verticalTreeLayout(child, config, childOffsetX, childY);

    childOffsetY += childHeight + config.siblingGap;
    currentOffsetX = childX + (child.children.length ? 0 : childWidth);

    if (!isHorizontal) {
      childOffsetX = currentOffsetX + (i < children.length - 1 ? config.siblingGap : 0);
    }
  });

  // Parent X position based on alignment
  const [firstChild, lastChild] = [children[0], children[children.length - 1]];
  const topOffsetX = config.layoutAlignment === 'Subtree'
    ? Math.min(firstChild.position.x, offsetX)
    : firstChild.position.x;
  const bottomOffsetX = config.layoutAlignment === 'Subtree'
    ? Math.max(lastChild.position.x + (lastChild.size?.width || 0), currentOffsetX)
    : lastChild.position.x + (lastChild.size?.width || 0);

  parentNode.position.x = isHorizontal
    ? offsetX
    : (topOffsetX + bottomOffsetX - parentWidth) / 2;

  // Return updated offset
  const maxChildrenWidth = Math.max(...children.map(child => child.size?.width || 0));
  return isHorizontal
    ? offsetX + maxChildrenWidth + parentWidth + config.levelGap
    : currentOffsetX;
};
