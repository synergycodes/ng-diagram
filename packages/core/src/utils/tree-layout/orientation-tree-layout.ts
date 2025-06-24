import { LayoutAngleType, TreeLayoutConfig, TreeNode } from '../../types/tree-layout.interface.ts';
import { getSign, isAngleHorizontal, isAngleVertical } from '../get-direction.ts';
import { getNodeSize, groupLayout, isLeafNode } from './tree-layout-utils.ts';

type Rect = { minX: number; maxX: number; minY: number; maxY: number };

const shiftSubtree = (node: TreeNode, dx: number, dy: number) => {
  node.position.x += dx;
  node.position.y += dy;
  if (node.children) {
    for (const child of node.children) {
      shiftSubtree(child, dx, dy);
    }
  }
};

/**
 * Calculates horizontal positions for a tree layout starting from the given parent node.
 *
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
  grandparentAngle: LayoutAngleType // ⬅️ nowy parametr
): Rect => {
  const parentAngle = parentNode.layoutAngle ?? config.layoutAngle;
  const isVertical = isAngleVertical(parentAngle);
  const sign = getSign(parentAngle);
  const children = parentNode.children || [];
  const parentWidth = parentNode.size?.width ?? 0;
  const parentHeight = parentNode.size?.height ?? 0;

  // offset dla dzieci
  let childOffsetX =
    offsetX + (!isVertical ? (sign === -1 ? -config.levelGap : sign * (parentWidth + config.levelGap)) : 0);
  let childOffsetY =
    offsetY + (isVertical ? (sign === -1 ? -config.levelGap : sign * (parentHeight + config.levelGap)) : 0);

  if (sign === -1 && grandparentAngle !== parentAngle) {
    if (!isVertical) {
      childOffsetY = offsetY;
    } else {
      childOffsetX = offsetX;
    }
  }

  let bounds: Rect = {
    minX: Infinity,
    maxX: -Infinity,
    minY: Infinity,
    maxY: -Infinity,
  };

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const { width, height } = getNodeSize(child);

    if (sign === -1 && isAngleVertical(grandparentAngle) === isVertical) {
      if (!isVertical) {
        childOffsetX -= width;
      } else {
        childOffsetY -= height;
      }
    }
    const childBounds = makeTreeLayout(child, config, childOffsetX, childOffsetY, parentAngle); // ⬅️ przekazujemy parentAngle jako grandparentAngle

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

    const subtreeCrossSize = isVertical ? childBounds.maxX - childBounds.minX : childBounds.maxY - childBounds.minY;

    if (isVertical) {
      childOffsetX += sign * (subtreeCrossSize + config.siblingGap);
    } else {
      childOffsetY += sign * (subtreeCrossSize + config.siblingGap);
    }
  }

  return bounds;
};

const maybeShiftChildren = (
  parent: TreeNode,
  angle: number,
  parentOffset: { x: number; y: number },
  childrenBounds: Rect,
  parentAngle: LayoutAngleType,
  grandparentAngle: LayoutAngleType
): void => {
  const isVertical = isAngleVertical(parentAngle);
  const sign = getSign(parentAngle);
  if (sign === -1 && isAngleVertical(grandparentAngle) === isVertical) return;
  // 1. CENTROWANIE DZIECI WZGLĘDEM RODZICA (jak poprzednio)
  const { width, height } = getNodeSize(parent);
  const childrenWidth = childrenBounds.maxX - childrenBounds.minX;
  const childrenHeight = childrenBounds.maxY - childrenBounds.minY;

  let shiftX = 0,
    shiftY = 0;
  if ((angle === 90 || angle === 270) && width > childrenWidth) {
    shiftX = (width - childrenWidth) / 2 + parentOffset.x - childrenBounds.minX;
  }
  if ((angle === 0 || angle === 180) && height > childrenHeight) {
    shiftY = (height - childrenHeight) / 2 + parentOffset.y - childrenBounds.minY;
  }

  if (shiftX !== 0 || shiftY !== 0) {
    for (const child of parent.children) {
      child.position.x += shiftX;
      child.position.y += shiftY;
    }
    // Aktualizuj granice dzieci po przesunięciu
    childrenBounds.minX += shiftX;
    childrenBounds.maxX += shiftX;
    childrenBounds.minY += shiftY;
    childrenBounds.maxY += shiftY;
  }

  // 2. GRANICA: NIE PRZEKRACZAJ offsetX/offsetY
  const deltaX = parentOffset.x - childrenBounds.minX;
  const deltaY = parentOffset.y - childrenBounds.minY;

  // Przesuwaj tylko jeśli wychodzimy poza offset
  if (deltaX > 0 || deltaY > 0) {
    const shiftSubtree = (node: TreeNode) => {
      node.position.x += deltaX > 0 ? deltaX : 0;
      node.position.y += deltaY > 0 ? deltaY : 0;
      node.children?.forEach(shiftSubtree);
    };
    shiftSubtree(parent);
    // Aktualizuj granice dzieci po przesunięciu
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

const alignParent = (
  parent: TreeNode,
  config: TreeLayoutConfig,
  childrenBounds: Rect,
  offsetX: number,
  offsetY: number,
  grandparentAngle: LayoutAngleType
): void => {
  const angle = parent.layoutAngle ?? config.layoutAngle;
  const isHorizontal = isAngleHorizontal(angle);
  const { width, height } = getNodeSize(parent);
  const [firstChild, lastChild] = [parent.children[0], parent.children.at(-1)!];
  const sign = getSign(angle);

  let x: number;
  let y: number;

  if (config.layoutAlignment === 'Start') {
    x = offsetX;
    y = offsetY;
  } else if (config.layoutAlignment === 'Subtree') {
    x = !isHorizontal ? (childrenBounds.minX + childrenBounds.maxX - width) / 2 : offsetX;
    y = isHorizontal ? (childrenBounds.minY + childrenBounds.maxY - height) / 2 : offsetY;
  } else {
    x = !isHorizontal
      ? (firstChild.position.x + lastChild.position.x + (lastChild.size?.width || 0) - width) / 2
      : offsetX;
    y = isHorizontal
      ? (firstChild.position.y + lastChild.position.y + (lastChild.size?.height || 0) - height) / 2
      : offsetY;
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

export const makeTreeLayout = (
  parent: TreeNode,
  config: TreeLayoutConfig,
  offsetX: number,
  offsetY: number,
  grandparentAngle: LayoutAngleType
): Rect => {
  const { width, height } = getNodeSize(parent);
  const parentAngle = parent.layoutAngle ?? config.layoutAngle;

  if (isLeafNode(parent)) {
    if (parent.type === 'group' && parent.groupChildren) {
      const delta = { x: offsetX - parent.position.x, y: offsetY - parent.position.y };
      groupLayout(parent.groupChildren, delta);
    }
    parent.position.x = offsetX;
    parent.position.y = offsetY;
    return {
      minX: offsetX,
      maxX: offsetX + width,
      minY: offsetY,
      maxY: offsetY + height,
    };
  }

  const angle = parent.layoutAngle ?? config.layoutAngle;

  // 1. Layout children get their bounding box
  const childrenBounds = layoutChildren(parent, config, offsetX, offsetY, grandparentAngle);

  // 2. Shift children if parent is wider/taller
  maybeShiftChildren(parent, angle, { x: offsetX, y: offsetY }, childrenBounds, parentAngle, grandparentAngle);

  // 3. Align parent (Start, Subtree, Parent)
  alignParent(parent, config, childrenBounds, offsetX, offsetY, grandparentAngle);

  // 4. Return bounding box for this subtree
  return {
    minX: Math.min(offsetX, childrenBounds.minX),
    maxX: Math.max(offsetX + width, childrenBounds.maxX),
    minY: Math.min(offsetY, childrenBounds.minY),
    maxY: Math.max(offsetY + height, childrenBounds.maxY),
  };
};
