import { Bounds, GroupNode, Node, Rect } from '../types';
import { getNodeMeasuredBounds } from './dimensions';
import { getBoundsFromRect, getRect, getRectFromBounds } from './rects-points-sizes';

interface CalculateGroupRectOptions {
  useGroupRect?: boolean;
  allowResizeBelowChildrenBounds?: boolean;
}

export const calculateGroupBounds = (
  childNodes: Node[],
  group: GroupNode,
  { useGroupRect = true, allowResizeBelowChildrenBounds = true }: CalculateGroupRectOptions = {}
): Bounds => {
  if (!group.size?.width || !group.size?.height) {
    throw new Error('Group must have both width and height defined');
  }

  if (allowResizeBelowChildrenBounds) {
    return { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity };
  }

  const groupBounds: Bounds = getBoundsFromRect(getRect(group));

  if (!childNodes.length) {
    return groupBounds;
  }

  const bounds = childNodes.reduce(
    (acc: Bounds, node: Node) => {
      // Validate that all child nodes have complete size information if they have any size
      if (node.size && (!node.size.width || !node.size.height)) {
        throw new Error(`calculateGroupBounds: child node ${node.id} does not have both width and height defined`);
      }

      // Use measuredBounds if available (accounts for rotation), otherwise compute it
      const nodeBounds = node.measuredBounds
        ? getBoundsFromRect(node.measuredBounds)
        : getBoundsFromRect(getNodeMeasuredBounds(node));

      acc.left = Math.min(acc.left, nodeBounds.left);
      acc.top = Math.min(acc.top, nodeBounds.top);
      acc.right = Math.max(acc.right, nodeBounds.right);
      acc.bottom = Math.max(acc.bottom, nodeBounds.bottom);

      return acc;
    },
    useGroupRect ? groupBounds : { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
  );

  return bounds;
};

export const calculateGroupRect = (
  childNodes: Node[],
  group: GroupNode,
  { useGroupRect = true }: CalculateGroupRectOptions = {}
): Rect => {
  const bounds = calculateGroupBounds(childNodes, group, { useGroupRect });

  return getRectFromBounds(bounds);
};
