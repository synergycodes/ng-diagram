import type { Node, Point, PortLocation } from '../types';
import { getRect } from './rects-points-sizes';

/**
 * Calculates the intersection point where a line from one point to another
 * intersects with the border of a rectangular node. This is used for floating
 * edges that don't have specific ports defined.
 *
 * The function calculates the exact intersection point on the node's border
 * by finding where a line from 'from' to the node's center intersects with
 * the rectangle edges.
 *
 * @param node - The node to calculate intersection with
 * @param from - Starting point of the line (typically the other node's center or port position)
 * @returns PortLocation with intersection point and the side that was intersected
 */
export const getNodeBorderIntersection = (node: Node, from: Point): PortLocation => {
  const nodeRect = getRect({ position: node.position, size: node.size });

  const nodeCenter: Point = {
    x: nodeRect.x + nodeRect.width / 2,
    y: nodeRect.y + nodeRect.height / 2,
  };

  const deltaX = nodeCenter.x - from.x;
  const deltaY = nodeCenter.y - from.y;

  if (deltaX === 0 && deltaY === 0) {
    return {
      x: nodeRect.x + nodeRect.width,
      y: nodeCenter.y,
      side: 'right',
    };
  }

  const left = deltaX !== 0 ? (nodeRect.x - from.x) / deltaX : -Infinity;
  const right = deltaX !== 0 ? (nodeRect.x + nodeRect.width - from.x) / deltaX : -Infinity;
  const top = deltaY !== 0 ? (nodeRect.y - from.y) / deltaY : -Infinity;
  const bottom = deltaY !== 0 ? (nodeRect.y + nodeRect.height - from.y) / deltaY : -Infinity;

  let result = Infinity;
  let side: PortLocation['side'] = 'right';

  if (left > 0 && left <= 1) {
    const y = from.y + left * deltaY;
    if (y >= nodeRect.y && y <= nodeRect.y + nodeRect.height && left < result) {
      result = left;
      side = 'left';
    }
  }

  if (right > 0 && right <= 1) {
    const y = from.y + right * deltaY;
    if (y >= nodeRect.y && y <= nodeRect.y + nodeRect.height && right < result) {
      result = right;
      side = 'right';
    }
  }

  if (top > 0 && top <= 1) {
    const x = from.x + top * deltaX;
    if (x >= nodeRect.x && x <= nodeRect.x + nodeRect.width && top < result) {
      result = top;
      side = 'top';
    }
  }

  if (bottom > 0 && bottom <= 1) {
    const x = from.x + bottom * deltaX;
    if (x >= nodeRect.x && x <= nodeRect.x + nodeRect.width && bottom < result) {
      result = bottom;
      side = 'bottom';
    }
  }

  if (result === Infinity) {
    return {
      x: nodeCenter.x,
      y: nodeCenter.y,
      side,
    };
  }

  const intersectionPoint: Point = {
    x: from.x + result * deltaX,
    y: from.y + result * deltaY,
  };

  return {
    ...intersectionPoint,
    side,
  };
};
