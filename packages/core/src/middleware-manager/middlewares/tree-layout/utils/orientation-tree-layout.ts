import { getNodeSize, groupLayout, isLeafNode, maybeShiftChildren } from './tree-layout-utils.ts';
import { Bounds, LayoutAngleType, TreeLayoutConfig, TreeNode } from '../../../../types';
import { getSign, isAngleHorizontal, isAngleVertical } from '../../../../utils';

/**
 * Calculates the bounding box for all children nodes in a tree layout,
 * starting from the given parent node and position.
 * @param parentNode
 * @param config
 * @param offsetX
 * @param offsetY
 * @param grandparentAngle
 * @returns {number}
 */
const layoutChildren = (
  parentNode: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number,
  grandparentAngle: LayoutAngleType
): Bounds => {
  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;
  const isVertical = isAngleVertical(parentAngle);
  const sign = getSign(parentAngle);
  const children = parentNode.children || [];
  const parentWidth = parentNode.size?.width ?? 0;
  const parentHeight = parentNode.size?.height ?? 0;

  let siblingOffset = isVertical ? offsetX : offsetY;
  let parentChildOffset = isVertical ? offsetY : offsetX;

  parentChildOffset +=
    // Set initial offset for children based on layout direction and sign
    sign === -1
      ? grandparentAngle !== parentAngle
        ? 0
        : -config.levelGap
      : sign * ((isVertical ? parentHeight : parentWidth) + config.levelGap);

  // Initialize bounding box for all children
  let bounds: Bounds = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  };

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const { width, height } = getNodeSize(child);

    if (sign === -1 && isAngleVertical(grandparentAngle) === isVertical) {
      parentChildOffset -= isVertical ? height : width;
    }

    // Recursively layout the child subtree
    const childBounds = makeTreeLayout(
      child,
      config,
      isVertical ? siblingOffset : parentChildOffset,
      isVertical ? parentChildOffset : siblingOffset,
      parentAngle
    );

    // For the last child, extend the bounding box if needed
    if (i === children.length - 1 && grandparentAngle !== parentAngle && sign === -1) {
      if (!isVertical) {
        childBounds.maxX += parentWidth + config.levelGap;
      } else {
        childBounds.maxY += parentHeight + config.levelGap;
      }
    }

    bounds = {
      minX: Math.min(bounds.minX, childBounds.minX),
      maxX: Math.max(bounds.maxX, childBounds.maxX),
      minY: Math.min(bounds.minY, childBounds.minY),
      maxY: Math.max(bounds.maxY, childBounds.maxY),
    };

    // Move offset for next sibling
    const subtreeCrossSize = isVertical ? childBounds.maxX - childBounds.minX : childBounds.maxY - childBounds.minY;

    siblingOffset += sign * (subtreeCrossSize + config.siblingGap);
  }

  return bounds;
};

const alignParent = (
  parent: TreeNode,
  config: TreeLayoutConfig,
  childrenBounds: Bounds,
  offsetX: number,
  offsetY: number,
  grandparentAngle: LayoutAngleType
): void => {
  const angle = parent.layoutAngle ?? config.layoutAngle;
  const layoutAlignment = parent.layoutAlignment ?? config.layoutAlignment;
  const isHorizontal = isAngleHorizontal(angle);
  const { width, height } = getNodeSize(parent);
  const [firstChild, lastChild] = [parent.children[0], parent.children.at(-1)!];
  const { width: lastChildWidth, height: lastChildHeight } = getNodeSize(lastChild);
  const sign = getSign(angle);

  let x: number;
  let y: number;

  if (layoutAlignment === 'Start') {
    x = offsetX;
    y = offsetY;
  } else if (layoutAlignment === 'Subtree') {
    x = !isHorizontal ? (childrenBounds.minX + childrenBounds.maxX - width) / 2 : offsetX;
    y = isHorizontal ? (childrenBounds.minY + childrenBounds.maxY - height) / 2 : offsetY;
  } else {
    x = !isHorizontal ? (firstChild.position.x + lastChild.position.x + (lastChildWidth || 0) - width) / 2 : offsetX;
    y = isHorizontal ? (firstChild.position.y + lastChild.position.y + (lastChildHeight || 0) - height) / 2 : offsetY;
  }

  if (!isHorizontal) x = Math.max(x, offsetX);
  else y = Math.max(y, offsetY);

  if (sign === -1 && grandparentAngle !== angle) {
    if (isHorizontal) {
      x = childrenBounds.maxX - width;
    } else {
      y = childrenBounds.maxY - height;
    }
  }

  if (parent.type === 'group' && parent.groupChildren) {
    const dx = x - parent.position.x;
    const dy = y - parent.position.y;
    groupLayout(parent.groupChildren, { x: dx, y: dy });
  }
  parent.position.x = x;
  parent.position.y = y;
};

/**
 * Calculates the layout for a tree starting from the given parent node.
 * Positions the parent and its children, and returns the bounding box (Rect) for the whole subtree.
 *
 * @param parentNode
 * @param config - Layout configuration options.
 * @param offsetX - X coordinate to start layout.
 * @param offsetY - Y coordinate to start layout.
 * @param grandparentAngle - The layout angle of the parent’s parent node.
 */
export const makeTreeLayout = (
  parentNode: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number,
  grandparentAngle: LayoutAngleType
): Bounds => {
  const { width, height } = getNodeSize(parentNode);
  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;

  if (isLeafNode(parentNode)) {
    if (parentNode.type === 'group' && parentNode.groupChildren) {
      const delta = { x: offsetX - parentNode.position.x, y: offsetY - parentNode.position.y };
      groupLayout(parentNode.groupChildren, delta);
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

  // Layout children get their bounding box
  const childrenBounds = layoutChildren(parentNode, config, offsetX, offsetY, grandparentAngle);

  // Shift children if the parent is bigger
  maybeShiftChildren(parentNode, parentAngle, { x: offsetX, y: offsetY }, childrenBounds, grandparentAngle);

  // Align parent (Start, Subtree, Parent)
  alignParent(parentNode, config, childrenBounds, offsetX, offsetY, grandparentAngle);

  // Return bounding box for this subtree
  return {
    minX: Math.min(offsetX, childrenBounds.minX),
    maxX: Math.max(offsetX + width, childrenBounds.maxX),
    minY: Math.min(offsetY, childrenBounds.minY),
    maxY: Math.max(offsetY + height, childrenBounds.maxY),
  };
};
