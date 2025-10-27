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
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
};

export const getBoundsFromRect = (rect: Rect): Bounds => {
  return {
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
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
