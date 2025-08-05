import { Bounds, GroupNode, Node, Rect } from '../types';
import { getBoundsFromRect, getRect, getRectFromBounds } from './rects-points-sizes';
import { getRotatedNodeBounds } from './rotated-bounds';

interface CalculateGroupRectOptions {
  useGroupRect?: boolean;
}

export const calculateGroupBounds = (
  childNodes: Node[],
  group: GroupNode,
  { useGroupRect = true }: CalculateGroupRectOptions = {}
): Bounds => {
  if (!group.size?.width || !group.size?.height) {
    throw new Error('Group must have both width and height defined');
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

      // Use rotated bounds if the node has an angle, otherwise use regular bounds
      const nodeBounds = node.angle ? getRotatedNodeBounds(node) : getBoundsFromRect(getRect(node));

      acc.minX = Math.min(acc.minX, nodeBounds.minX);
      acc.minY = Math.min(acc.minY, nodeBounds.minY);
      acc.maxX = Math.max(acc.maxX, nodeBounds.maxX);
      acc.maxY = Math.max(acc.maxY, nodeBounds.maxY);

      return acc;
    },
    useGroupRect ? groupBounds : { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
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
