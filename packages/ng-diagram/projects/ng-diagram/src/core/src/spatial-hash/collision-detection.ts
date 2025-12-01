import type { Node, Point, Rect } from '../types';
import { getRect, getRotatedCorners } from '../utils';

export type RectWithAngle = Rect & { angle?: number };

export const checkCollision = (a: Node | RectWithAngle, b: Node | RectWithAngle): boolean => {
  if (isNode(a) && !a.size) {
    return false;
  }
  if (isNode(b) && !b.size) {
    return false;
  }

  const cornersA = getCollisionCorners(a);
  const cornersB = getCollisionCorners(b);

  if (cornersA.length === 0 || cornersB.length === 0) {
    return false;
  }

  const axes = [...getRectangleAxes(cornersA), ...getRectangleAxes(cornersB)];

  for (const axis of axes) {
    const projA = projectRectangle(cornersA, axis);
    const projB = projectRectangle(cornersB, axis);

    if (!projectionsOverlap(projA, projB)) {
      return false;
    }
  }

  return true;
};

const isNode = (obj: Node | RectWithAngle): obj is Node => {
  return 'position' in obj;
};

const getCollisionCorners = (obj: Node | RectWithAngle): Point[] => {
  if (isNode(obj)) {
    if (!obj.size) {
      return [];
    }
    return getRotatedCorners(getRect(obj), obj.angle ?? 0);
  }
  return getRotatedCorners(obj, obj.angle ?? 0);
};

const projectRectangle = (corners: Point[], axis: Point): { min: number; max: number } => {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;

  for (let i = 1; i < corners.length; i++) {
    const projection = corners[i].x * axis.x + corners[i].y * axis.y;
    if (projection < min) {
      min = projection;
    }
    if (projection > max) {
      max = projection;
    }
  }

  return { min, max };
};

const projectionsOverlap = (proj1: { min: number; max: number }, proj2: { min: number; max: number }): boolean => {
  return !(proj1.max < proj2.min || proj2.max < proj1.min);
};

const getRectangleAxes = (corners: Point[]): Point[] => {
  const axes: Point[] = [];

  for (let i = 0; i < corners.length; i++) {
    const p1 = corners[i];
    const p2 = corners[(i + 1) % corners.length];

    const edge = {
      x: p2.x - p1.x,
      y: p2.y - p1.y,
    };

    const length = Math.sqrt(edge.x * edge.x + edge.y * edge.y);
    if (length > 0) {
      axes.push({
        x: -edge.y / length,
        y: edge.x / length,
      });
    }
  }

  return axes;
};
