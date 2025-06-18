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
  let currentOffsetY = offsetY;
  parentNode.position.x = offsetX;

  // Handle leaf node (no children)
  if (!children.length) {
    parentNode.position.y = (offsetY + currentOffsetY) / 2;
    return currentOffsetY;
  }
  // 2. Initialize dimensions and direction
  const { width: parentWidth = 0, height: parentHeight = 0 } = parentNode.size || {};

  const parentAngle = parentNode?.layoutAngle || config.layoutAngle;
  const directionSign = getSign(parentNode?.layoutAngle || config.layoutAngle);

  let childOffsetY = offsetY;

  children.forEach((child, index) => {
    const { width: childWidth = 0, height: childHeight = 0 } = child.size || {};

    const childX =
      directionSign === 1
        ? // Angle 0°: children positioned to the right of the parent
          offsetX + parentWidth + config.levelGap
        : // Angle 180°: children positioned to the left of the parent
          offsetX - (childWidth + config.levelGap);

    const childY = isAngleHorizontal(parentAngle)
      ? horizontalTreeLayout(child, config, childX, childOffsetY)
      : verticalTreeLayout(child, config, childX, childOffsetY);

    // Update currentOffsetY for the next child
    currentOffsetY = childY + (child.children.length > 0 ? 0 : childHeight);
    childOffsetY = currentOffsetY + (index < children.length - 1 ? config.siblingGap : 0);
  });

  // Calculate parent's Y position based on alignment mode
  const firstChild = children[0];
  const lastChild = children[children.length - 1];

  const topOffsetY =
    config.layoutAlignment === 'Subtree' ? Math.min(firstChild.position.y, offsetY) : firstChild.position.y;

  const bottomOffsetY =
    config.layoutAlignment === 'Subtree'
      ? Math.max(lastChild.position.y + (lastChild.size?.height || 0), currentOffsetY)
      : lastChild.position.y + (lastChild.size?.height || 0);

  parentNode.position.y = (topOffsetY + bottomOffsetY - parentHeight) / 2;
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

  // Handle leaf node (no children)
  if (!children.length) {
    parentNode.position.x = (offsetX + currentOffsetX) / 2;
    return currentOffsetX;
  }
  // 2. Initialize dimensions and direction
  const { width: parentWidth = 0, height: parentHeight = 0 } = parentNode.size || {};

  const parentAngle = parentNode?.layoutAngle || config.layoutAngle;
  const directionSign = getSign(parentNode?.layoutAngle || config.layoutAngle);

  let childOffsetX = offsetX;

  children.forEach((child, index) => {
    const { width: childWidth = 0, height: childHeight = 0 } = child.size || {};

    const childY =
      directionSign === 1
        ? // Angle 0°: children positioned to the right of the parent
        offsetY + parentHeight + config.levelGap
        : // Angle 180°: children positioned to the left of the parent
        offsetY - (childHeight + config.levelGap);

    const childX = isAngleHorizontal(parentAngle)
      ? horizontalTreeLayout(child, config, childOffsetX, childY)
      : verticalTreeLayout(child, config, childOffsetX, childY);

    // Update currentOffsetX for the next child
    currentOffsetX = childX + (child.children.length > 0 ? 0 : childWidth);
    childOffsetX = currentOffsetX + (index < children.length - 1 ? config.siblingGap : 0);
  });

  // Calculate parent's X position based on alignment mode
  const firstChild = children[0];
  const lastChild = children[children.length - 1];

  const topOffsetX =
    config.layoutAlignment === 'Subtree' ? Math.min(firstChild.position.x, offsetX) : firstChild.position.x;

  const bottomOffsetX =
    config.layoutAlignment === 'Subtree'
      ? Math.max(lastChild.position.x + (lastChild.size?.width || 0), currentOffsetX)
      : lastChild.position.x + (lastChild.size?.width || 0);

  parentNode.position.x = (topOffsetX + bottomOffsetX - parentWidth) / 2;
  return currentOffsetX;
};
