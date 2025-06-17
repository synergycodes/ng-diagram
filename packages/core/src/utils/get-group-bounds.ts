import { Bounds, Node, Rect } from '../types';
import { getBoundsFromRect, getRect, getRectFromBounds } from './rects-points-sizes';

interface CalculateGroupRectOptions {
  useGroupRect?: boolean;
}

export const calculateGroupRect = (
  childNodes: Node[],
  group: Node,
  { useGroupRect = true }: CalculateGroupRectOptions = {}
): Rect => {
  const groupBounds: Bounds = getBoundsFromRect(getRect(group));

  if (!childNodes.length) {
    return getRectFromBounds(groupBounds);
  }

  const bounds = childNodes.reduce(
    (acc: Bounds, node: Node) => {
      const nodeBounds = getBoundsFromRect(getRect(node));

      acc.minX = Math.min(acc.minX, nodeBounds.minX);
      acc.minY = Math.min(acc.minY, nodeBounds.minY);
      acc.maxX = Math.max(acc.maxX, nodeBounds.maxX);
      acc.maxY = Math.max(acc.maxY, nodeBounds.maxY);

      return acc;
    },
    useGroupRect ? groupBounds : { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  );

  return getRectFromBounds(bounds);
};
