import { Bounds, Node, Point } from '../types';

/**
 * Rotates a point around a center point by a given angle
 * @param point The point to rotate
 * @param center The center of rotation
 * @param angle The angle in degrees
 * @returns The rotated point
 */
function rotatePoint(point: Point, center: Point, angle: number): Point {
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * Gets the four corners of a node's bounding box
 * @param node The node
 * @returns Array of four corner points
 */
function getNodeCorners(node: Node): Point[] {
  const { x, y } = node.position;
  const { width = 0, height = 0 } = node.size || {};

  return [
    { x, y }, // top-left
    { x: x + width, y }, // top-right
    { x: x + width, y: y + height }, // bottom-right
    { x, y: y + height }, // bottom-left
  ];
}

/**
 * Calculates the bounding box of a rotated node
 * @param node The node (may have angle and rotationCenter properties)
 * @returns The bounds that encompass the rotated node
 */
export function getRotatedNodeBounds(node: Node): Bounds {
  const { width = 0, height = 0 } = node.size || {};
  const angle = node.angle || 0;

  // If no rotation, return regular bounds
  if (angle === 0) {
    return {
      minX: node.position.x,
      minY: node.position.y,
      maxX: node.position.x + width,
      maxY: node.position.y + height,
    };
  }

  // Get rotation center (use custom center with normalized values or default to center)
  const centerX = node.rotationCenter ? node.rotationCenter.x : 0.5;
  const centerY = node.rotationCenter ? node.rotationCenter.y : 0.5;

  const rotationCenter: Point = {
    x: node.position.x + width * centerX,
    y: node.position.y + height * centerY,
  };

  // Get all four corners and rotate them
  const corners = getNodeCorners(node);
  const rotatedCorners = corners.map((corner) => rotatePoint(corner, rotationCenter, angle));

  // Find the bounding box of the rotated corners
  const bounds: Bounds = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  for (const corner of rotatedCorners) {
    bounds.minX = Math.min(bounds.minX, corner.x);
    bounds.minY = Math.min(bounds.minY, corner.y);
    bounds.maxX = Math.max(bounds.maxX, corner.x);
    bounds.maxY = Math.max(bounds.maxY, corner.y);
  }

  return bounds;
}
