import type { Node, Point, PortLocation, PortSide } from '../types';
import { getRect } from './rects-points-sizes';

/**
 * Rotates a point around a center by a given angle (in radians)
 */
const rotatePoint = (point: Point, center: Point, angle: number): Point => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
};

/**
 * Finds intersection of two line segments, returns null if no intersection.
 * Uses parametric form to find intersection point.
 *
 * @param p1 - Start of first segment
 * @param p2 - End of first segment
 * @param p3 - Start of second segment
 * @param p4 - End of second segment
 * @returns Intersection point or null if segments don't intersect
 */
const lineSegmentIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-10) return null; // Parallel lines

  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  const u = -((p1.x - p2.x) * (p1.y - p3.y) - (p1.y - p2.y) * (p1.x - p3.x)) / d;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * (p2.x - p1.x),
      y: p1.y + t * (p2.y - p1.y),
    };
  }
  return null;
};

/**
 * Computes the outward normal vector of an edge defined by two points.
 * The normal points outward from the rectangle (perpendicular to edge, pointing away from center).
 *
 * @param edgeStart - Start point of the edge
 * @param edgeEnd - End point of the edge
 * @returns Normalized outward normal vector
 */
const getOutwardNormal = (edgeStart: Point, edgeEnd: Point): Point => {
  // Edge vector
  const edgeX = edgeEnd.x - edgeStart.x;
  const edgeY = edgeEnd.y - edgeStart.y;

  // Perpendicular vector (rotated 90 degrees clockwise)
  // For corners defined in order: top-left, top-right, bottom-right, bottom-left
  // This gives outward-pointing normals
  const normalX = edgeY;
  const normalY = -edgeX;

  // Normalize
  const length = Math.hypot(normalX, normalY);
  if (length === 0) return { x: 1, y: 0 };

  return { x: normalX / length, y: normalY / length };
};

/**
 * Maps an outward normal vector to the closest cardinal direction (side).
 * This determines which direction the edge should exit from the node.
 *
 * @param normal - The outward normal vector (should be normalized)
 * @returns The side representing the exit direction
 */
const normalToSide = (normal: Point): PortSide => {
  // Find which cardinal direction the normal is closest to
  // right: (1, 0), left: (-1, 0), bottom: (0, 1), top: (0, -1)
  if (Math.abs(normal.x) >= Math.abs(normal.y)) {
    return normal.x >= 0 ? 'right' : 'left';
  } else {
    return normal.y >= 0 ? 'bottom' : 'top';
  }
};

/**
 * Calculates the intersection point where a line from one point to another
 * intersects with the border of a rectangular node. This is used for floating
 * edges that don't have specific ports defined.
 *
 * The function supports rotated nodes by calculating intersections with the
 * rotated rectangle edges.
 *
 * @param node - The node to calculate intersection with
 * @param from - Starting point of the line (typically the other node's center or port position)
 * @returns PortLocation with intersection point and the side that was intersected
 */
export const getNodeBorderIntersection = (node: Node, from: Point): PortLocation => {
  const nodeRect = getRect({ position: node.position, size: node.size });
  const angle = ((node.angle || 0) * Math.PI) / 180;

  const center: Point = {
    x: nodeRect.x + nodeRect.width / 2,
    y: nodeRect.y + nodeRect.height / 2,
  };

  if (from.x === center.x && from.y === center.y) {
    const rightPoint =
      angle !== 0
        ? rotatePoint({ x: nodeRect.x + nodeRect.width, y: center.y }, center, angle)
        : { x: nodeRect.x + nodeRect.width, y: center.y };

    const exitNormal = angle !== 0 ? rotatePoint({ x: 1, y: 0 }, { x: 0, y: 0 }, angle) : { x: 1, y: 0 };

    return {
      x: rightPoint.x,
      y: rightPoint.y,
      side: normalToSide(exitNormal),
    };
  }

  const corners: Point[] = [
    { x: nodeRect.x, y: nodeRect.y },
    { x: nodeRect.x + nodeRect.width, y: nodeRect.y },
    { x: nodeRect.x + nodeRect.width, y: nodeRect.y + nodeRect.height },
    { x: nodeRect.x, y: nodeRect.y + nodeRect.height },
  ];

  const rotatedCorners = angle !== 0 ? corners.map((c) => rotatePoint(c, center, angle)) : corners;

  let closestIntersection: Point | null = null;
  let closestDistance = Infinity;
  let hitEdgeStart: Point | null = null;
  let hitEdgeEnd: Point | null = null;

  for (let i = 0; i < 4; i++) {
    const edgeStart = rotatedCorners[i];
    const edgeEnd = rotatedCorners[(i + 1) % 4];

    const intersection = lineSegmentIntersection(from, center, edgeStart, edgeEnd);
    if (intersection) {
      const dist = Math.hypot(intersection.x - from.x, intersection.y - from.y);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestIntersection = intersection;
        hitEdgeStart = edgeStart;
        hitEdgeEnd = edgeEnd;
      }
    }
  }

  if (!closestIntersection || !hitEdgeStart || !hitEdgeEnd) {
    return { x: center.x, y: center.y, side: 'right' };
  }

  const outwardNormal = getOutwardNormal(hitEdgeStart, hitEdgeEnd);
  const side = normalToSide(outwardNormal);

  return {
    x: closestIntersection.x,
    y: closestIntersection.y,
    side,
  };
};
