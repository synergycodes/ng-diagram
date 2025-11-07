import type { Node, Rect } from '../types';
import { Point } from '../types';
import { getRect } from '../utils';

export type RectWithAngle = Rect & { angle?: number };

export const checkCollision = (a: Node | RectWithAngle, b: Node | RectWithAngle): boolean => {
  if (isNode(a) && !a.size) {
    return false;
  }
  if (isNode(b) && !b.size) {
    return false;
  }

  const cornersA = getRotatedCorners(a);
  const cornersB = getRotatedCorners(b);

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

const getRotatedCorners = (obj: Node | RectWithAngle): Point[] => {
  let rect: Rect;
  let angle: number;

  if (isNode(obj)) {
    if (!obj.size) {
      return [];
    }
    rect = getRect(obj);
    angle = ((obj.angle || 0) * Math.PI) / 180;
  } else {
    rect = obj;
    angle = ((obj.angle || 0) * Math.PI) / 180;
  }

  const { x, y, width, height } = rect;
  const cx = x + width / 2;
  const cy = y + height / 2;

  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  return corners.map(({ x: px, y: py }) => {
    const dx = px - cx;
    const dy = py - cy;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  });
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
