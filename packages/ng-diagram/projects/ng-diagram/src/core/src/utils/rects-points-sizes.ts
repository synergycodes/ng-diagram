import { Bounds, Point, Rect, Size } from '../types';

export const getPointRangeRect = (point: Point, range: number): Rect => {
  return {
    x: point.x - range,
    y: point.y - range,
    width: range * 2,
    height: range * 2,
  };
};

export const isSameRect = (rect1?: Rect, rect2?: Rect): boolean => {
  return (
    rect1?.x === rect2?.x && rect1?.y === rect2?.y && rect1?.width === rect2?.width && rect1?.height === rect2?.height
  );
};

export const getRect = ({
  position = { x: 0, y: 0 },
  size = { width: 1, height: 1 },
}: {
  position?: Point;
  size?: Size;
}): Rect => {
  return {
    x: position?.x || 0,
    y: position?.y || 0,
    width: size?.width || 1,
    height: size?.height || 1,
  };
};

export const doesRectsIntersect = (rect1: Rect, rect2: Rect): boolean => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  );
};

/**
 *
 * @param rect1 Rectangle to check if it contains `rect2`
 * @param rect2 Rectangle to check if it's contained within `rect1`
 * @returns true if `rect2` is fully within `rect1` bounds, false otherwise.
 */
export const doesContainRect = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x <= rect2.x &&
    rect1.x + rect1.width >= rect2.x + rect2.width &&
    rect1.y <= rect2.y &&
    rect1.y + rect1.height >= rect2.y + rect2.height
  );
};

export const getDistanceBetweenRects = (rect1: Rect, rect2: Rect): number => {
  if (doesRectsIntersect(rect1, rect2)) {
    return 0;
  }
  const rect1Right = rect1.x + rect1.width;
  const rect1Bottom = rect1.y + rect1.height;
  const rect2Right = rect2.x + rect2.width;
  const rect2Bottom = rect2.y + rect2.height;

  if (rect1Right <= rect2.x) {
    if (rect1Bottom <= rect2.y) {
      return Math.sqrt((rect1Right - rect2.x) ** 2 + (rect1Bottom - rect2.y) ** 2);
    }
    if (rect1.y >= rect2Bottom) {
      return Math.sqrt((rect1Right - rect2.x) ** 2 + (rect1.y - rect2Bottom) ** 2);
    }
    return rect2.x - rect1Right;
  }

  if (rect1.x >= rect2Right) {
    if (rect1Bottom <= rect2.y) {
      return Math.sqrt((rect1.x - rect2Right) ** 2 + (rect1Bottom - rect2.y) ** 2);
    }
    if (rect1.y >= rect2Bottom) {
      return Math.sqrt((rect1.x - rect2Right) ** 2 + (rect1.y - rect2Bottom) ** 2);
    }
    return rect1.x - rect2Right;
  }

  if (rect1Bottom <= rect2.y) {
    return rect2.y - rect1Bottom;
  }
  if (rect1.y >= rect2Bottom) {
    return rect1.y - rect2Bottom;
  }
  return Infinity;
};

export const isSamePoint = (point1?: Point, point2?: Point): boolean => {
  return point1?.x === point2?.x && point1?.y === point2?.y;
};

export const isSameSize = (size1?: Size, size2?: Size): boolean => {
  return size1?.width === size2?.width && size1?.height === size2?.height;
};

export const getRectFromBounds = (bounds: Bounds): Rect => {
  return {
    x: bounds.left,
    y: bounds.top,
    width: bounds.right - bounds.left,
    height: bounds.bottom - bounds.top,
  };
};

export const getBoundsFromRect = (rect: Rect): Bounds => {
  return {
    left: rect.x,
    top: rect.y,
    right: rect.x + rect.width,
    bottom: rect.y + rect.height,
  };
};

export const equalPointsArrays = (path1: Point[], path2: Point[]) => {
  if (path1.length !== path2.length) return false;

  for (let i = 0; i < path1.length; i++) {
    if (!isSamePoint(path1[i], path2[i])) {
      return false;
    }
  }
  return true;
};

export const unionRect = (rects: Rect[]): Rect => {
  if (rects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = rects[0].x;
  let minY = rects[0].y;
  let maxX = rects[0].x + rects[0].width;
  let maxY = rects[0].y + rects[0].height;

  rects.forEach((rect) => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

export const boundingRectOfPoints = (points: Point[]): Rect => {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  points.forEach((point) => {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  });

  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
};

/**
 * Calculates the four corners of a rectangle rotated around its center.
 * @param rect The rectangle with position and size
 * @param angleDegrees The rotation angle in degrees
 * @returns Array of 4 corner points after rotation
 */
export const getRotatedCorners = (rect: Rect, angleDegrees = 0): Point[] => {
  const { x, y, width, height } = rect;
  const cx = x + width / 2;
  const cy = y + height / 2;
  const angle = (angleDegrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];

  return corners.map(({ x: px, y: py }) => {
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    };
  });
};

/**
 * Calculates the axis-aligned bounding box of a rotated rectangle.
 * @param rect The rectangle with position and size
 * @param angleDegrees The rotation angle in degrees
 * @returns The bounding rect that encompasses the rotated rectangle
 */
export const getRotatedBoundingRect = (rect: Rect, angleDegrees = 0): Rect => {
  if (angleDegrees === 0) {
    return rect;
  }
  return boundingRectOfPoints(getRotatedCorners(rect, angleDegrees));
};
