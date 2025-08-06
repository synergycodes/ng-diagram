import { Bounds, GroupNode, Node, Point, Rect } from '../types';
import { getBoundsFromRect, getRect, getRectFromBounds } from './rects-points-sizes';
import { getRotatedNodeBounds } from './rotated-bounds';

interface CalculateGroupRectOptions {
  useGroupRect?: boolean;
}

/**
 * Transforms a point from world space to the group's local (unrotated) coordinate system
 * This is used when children maintain world positions but we need to check against
 * the group's unrotated boundaries
 */
function worldToGroupLocal(worldPoint: Point, group: GroupNode): Point {
  if (!group.angle || group.angle === 0) {
    return worldPoint;
  }

  const { width = 0, height = 0 } = group.size || {};
  const centerX = group.rotationCenter?.x ?? 0.5;
  const centerY = group.rotationCenter?.y ?? 0.5;

  // Calculate rotation center in world space
  const rotationCenter: Point = {
    x: group.position.x + width * centerX,
    y: group.position.y + height * centerY,
  };

  // Rotate the point by negative angle around the rotation center
  const rad = (-group.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = worldPoint.x - rotationCenter.x;
  const dy = worldPoint.y - rotationCenter.y;

  // Apply inverse rotation
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  // Return point in group's local space
  return {
    x: rotationCenter.x + localX,
    y: rotationCenter.y + localY,
  };
}

/**
 * Calculates the minimum rectangle that contains the rotated group and all its children
 * For rotated groups where children don't rotate with the group
 */
function calculateRotatedGroupRect(childNodes: Node[], group: GroupNode, useGroupRect: boolean): Rect {
  if (!group.size?.width || !group.size?.height) {
    throw new Error('Group must have both width and height defined');
  }

  const { width, height } = group.size;
  const centerX = group.rotationCenter?.x ?? 0.5;
  const centerY = group.rotationCenter?.y ?? 0.5;

  // Calculate rotation center in world space
  const rotationCenter: Point = {
    x: group.position.x + width * centerX,
    y: group.position.y + height * centerY,
  };

  // Start with the group's unrotated bounds
  let minX = group.position.x;
  let minY = group.position.y;
  let maxX = group.position.x + width;
  let maxY = group.position.y + height;

  if (!useGroupRect && childNodes.length > 0) {
    minX = Infinity;
    minY = Infinity;
    maxX = -Infinity;
    maxY = -Infinity;
  }

  // Process each child
  for (const child of childNodes) {
    if (child.size && (!child.size.width || !child.size.height)) {
      throw new Error(`calculateRotatedGroupRect: child node ${child.id} does not have both width and height defined`);
    }

    // Get child's actual rectangle corners in world space
    const childRect = getRect(child);
    let childCorners: Point[] = [
      { x: childRect.x, y: childRect.y },
      { x: childRect.x + childRect.width, y: childRect.y },
      { x: childRect.x + childRect.width, y: childRect.y + childRect.height },
      { x: childRect.x, y: childRect.y + childRect.height },
    ];

    // If child is rotated, rotate its corners around its center
    if (child.angle) {
      const childCenterX = child.rotationCenter?.x ?? 0.5;
      const childCenterY = child.rotationCenter?.y ?? 0.5;
      const childRotationCenter = {
        x: childRect.x + childRect.width * childCenterX,
        y: childRect.y + childRect.height * childCenterY,
      };

      const childRad = (child.angle * Math.PI) / 180;
      const childCos = Math.cos(childRad);
      const childSin = Math.sin(childRad);

      childCorners = childCorners.map((corner) => {
        const dx = corner.x - childRotationCenter.x;
        const dy = corner.y - childRotationCenter.y;
        return {
          x: childRotationCenter.x + dx * childCos - dy * childSin,
          y: childRotationCenter.y + dx * childSin + dy * childCos,
        };
      });
    }

    // Transform each corner to group's local coordinate system
    for (const corner of childCorners) {
      const localPoint = worldToGroupLocal(corner, group);
      minX = Math.min(minX, localPoint.x);
      minY = Math.min(minY, localPoint.y);
      maxX = Math.max(maxX, localPoint.x);
      maxY = Math.max(maxY, localPoint.y);
    }
  }

  // Calculate the new size needed in local space
  const newWidth = maxX - minX;
  const newHeight = maxY - minY;

  // Calculate offset from original position
  const offsetX = minX - group.position.x;
  const offsetY = minY - group.position.y;

  // If we need to expand, calculate new position maintaining rotation center
  if (offsetX !== 0 || offsetY !== 0 || newWidth !== width || newHeight !== height) {
    // The new unrotated position
    const newPosition = { x: minX, y: minY };

    // We need to adjust the position so that when rotated, the group still contains all children
    // This requires rotating the offset around the rotation center
    const rad = ((group.angle || 0) * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // Calculate where the new top-left needs to be in world space
    // to maintain the rotation center position
    const newCenterX = newPosition.x + newWidth * centerX;
    const newCenterY = newPosition.y + newHeight * centerY;

    // Offset from old center to new center
    const centerDx = newCenterX - rotationCenter.x;
    const centerDy = newCenterY - rotationCenter.y;

    // Rotate this offset
    const rotatedDx = centerDx * cos - centerDy * sin;
    const rotatedDy = centerDx * sin + centerDy * cos;

    // Apply the rotated offset to get the final position
    const finalX = rotationCenter.x + rotatedDx - newWidth * centerX;
    const finalY = rotationCenter.y + rotatedDy - newHeight * centerY;

    return {
      x: finalX,
      y: finalY,
      width: newWidth,
      height: newHeight,
    };
  }

  return {
    x: group.position.x,
    y: group.position.y,
    width,
    height,
  };
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
  // Special handling for rotated groups where children don't rotate with the group
  if (group.angle && group.angle !== 0) {
    return calculateRotatedGroupRect(childNodes, group, useGroupRect);
  }

  // For non-rotated groups, use the standard calculation
  const bounds = calculateGroupBounds(childNodes, group, { useGroupRect });
  return getRectFromBounds(bounds);
};
