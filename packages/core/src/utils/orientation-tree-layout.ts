import { TreeLayoutConfig, TreeNode } from '../types';
import { getSign, isAngleHorizontal, isAngleVertical } from './get-direction.ts';

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
  const parentHeight = parentNode.size?.height || 0;

  const parentAngle = parentNode?.layoutAngle || config.layoutAngle;
  const sign = getSign(parentAngle);

  let childOffsetY = offsetY;

  children.forEach((child, i) => {
    const childHeight = child.size?.height || 0;
    const childWidth = child.size?.width || 0;

    const childX = sign === 1
      // Angle 0°: children positioned to the right of the parent
      ? offsetX + parentWidth + config.levelGap
      // Angle 180°: children positioned to the left of the parent
      : offsetX - (childWidth + config.levelGap);

    const childY = isAngleHorizontal(parentAngle)
      ? horizontalTreeLayout(child, config, childX, childOffsetY)
      : verticalTreeLayout(child, config, childX, childOffsetY);
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

  const parentWidth = parentNode.size?.width || 0;
  const parentHeight = parentNode.size?.height || 0;

  const parentAngle = parentNode?.layoutAngle || config.layoutAngle;
  const sign = getSign(parentAngle);

  let childOffsetX = offsetX;

  children.forEach((child, i) => {

    const childHeight = child.size?.height || 0;
    const childWidth = child.size?.width || 0;

    const childY = sign === 1
      // Angle 90°: children positioned to the bottom of the parent
      ? offsetY + parentHeight + config.levelGap
      // Angle 270°: children positioned to the top of the parent
      : offsetY - (childHeight + config.levelGap);

    const childX = isAngleVertical(parentAngle)
      ? verticalTreeLayout(child, config, childOffsetX, childY)
      : horizontalTreeLayout(child, config, childOffsetX, childY);

    currentOffsetX = childX + (child.children.length > 0 ? 0 : childWidth);
    childOffsetX = currentOffsetX + (i < children.length - 1 ? config.siblingGap : 0);
  });

  const topOffsetX = Math.min(children[0].position.x, offsetX);
  parentNode.position.x = (topOffsetX + currentOffsetX - parentWidth) / 2;

  return currentOffsetX;
};
