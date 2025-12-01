import { describe, expect, it } from 'vitest';
import {
  boundingRectOfPoints,
  doesContainRect,
  doesRectsIntersect,
  equalPointsArrays,
  getDistanceBetweenRects,
  getPointRangeRect,
  getRect,
  getRotatedBoundingRect,
  getRotatedCorners,
  isSamePoint,
  isSameRect,
  isSameSize,
  unionRect,
} from '../rects-points-sizes';

describe('rects', () => {
  describe('getPointRangeRect', () => {
    it('should return a rect with the correct size', () => {
      const point = { x: 10, y: 10 };
      const range = 5;

      const result = getPointRangeRect(point, range);

      expect(result).toEqual({ x: 5, y: 5, width: 10, height: 10 });
    });
  });

  describe('isSameRect', () => {
    it('should return true if the rects are the same', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });

      expect(isSameRect(rect1, rect2)).toBe(true);
    });

    it('should return false if the rects are not the same', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 15, height: 10 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });

      expect(isSameRect(rect1, rect2)).toBe(false);
    });
  });

  describe('getRect', () => {
    it('should return default properties if nothing passed', () => {
      const result = getRect({});

      expect(result).toEqual({ x: 0, y: 0, width: 1, height: 1 });
    });

    it('should return the correct properties if passed', () => {
      const result = getRect({ position: { x: 10, y: 10 }, size: { width: 10, height: 10 } });

      expect(result).toEqual({ x: 10, y: 10, width: 10, height: 10 });
    });

    it('should fallback width to 1 when size.width is 0', () => {
      const result = getRect({ position: { x: 2, y: 3 }, size: { width: 0, height: 4 } });
      expect(result).toEqual({ x: 2, y: 3, width: 1, height: 4 });
    });

    it('should fallback height to 1 when size.height is 0', () => {
      const result = getRect({ position: { x: 5, y: 6 }, size: { width: 7, height: 0 } });
      expect(result).toEqual({ x: 5, y: 6, width: 7, height: 1 });
    });
  });

  describe('doesRectsIntersect', () => {
    it('should return true if the rects intersects from the right', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 5, y: 5 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return true if the rects intersects from the left', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: -5, y: -5 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(true);
    });

    it('should return false if the rects do not intersect', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 15, y: 15 }, size: { width: 10, height: 10 } });

      expect(doesRectsIntersect(rect1, rect2)).toBe(false);
    });
  });

  describe('doesContainRect', () => {
    it('should return true when rect2 is fully contained within rect1', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 10, y: 10 }, size: { width: 20, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(true);
    });

    it('should return true when rect2 is exactly the same as rect1', () => {
      const rect1 = getRect({ position: { x: 5, y: 5 }, size: { width: 50, height: 50 } });
      const rect2 = getRect({ position: { x: 5, y: 5 }, size: { width: 50, height: 50 } });

      expect(doesContainRect(rect1, rect2)).toBe(true);
    });

    it('should return true when rect2 touches the edges of rect1', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });

      expect(doesContainRect(rect1, rect2)).toBe(true);
    });

    it('should return false when rect2 extends beyond rect1 right edge', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 50, y: 10 }, size: { width: 60, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect2 extends beyond rect1 bottom edge', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 10, y: 50 }, size: { width: 20, height: 60 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect2 extends beyond rect1 left edge', () => {
      const rect1 = getRect({ position: { x: 10, y: 10 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 5, y: 20 }, size: { width: 20, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect2 extends beyond rect1 top edge', () => {
      const rect1 = getRect({ position: { x: 10, y: 10 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 20, y: 5 }, size: { width: 20, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect2 is completely outside rect1', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const rect2 = getRect({ position: { x: 100, y: 100 }, size: { width: 20, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect2 partially overlaps rect1', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 50, height: 50 } });
      const rect2 = getRect({ position: { x: 40, y: 40 }, size: { width: 20, height: 20 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });

    it('should return false when rect1 is smaller than rect2', () => {
      const rect1 = getRect({ position: { x: 10, y: 10 }, size: { width: 20, height: 20 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });

      expect(doesContainRect(rect1, rect2)).toBe(false);
    });
  });

  describe('getDistanceBetweenRects', () => {
    it('should return 0 if rects intersects', () => {
      const rect1 = getRect({ position: { x: -1, y: -1 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(0);
    });

    it('should return euclidean distance between bottom right corner and top left corner if first rect above and on the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between top and bottom of rects if first rect above the second rect', () => {
      const rect1 = getRect({ position: { x: 0, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return the euclidean distance between bottom left corner and top right corner if first rect above and on the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: -10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between right and left of rects if first rect to the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: 0 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return euclidean distance between top left and bottom right corner of rects if first rect to the below and on the right of the second rect', () => {
      const rect1 = getRect({ position: { x: 10, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between top and bottom of rects if first rect below the second rect', () => {
      const rect1 = getRect({ position: { x: 0, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });

    it('should return euclidean distance between top right and bottom left corner of rects if first rect to the below and on the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: 10 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(Math.sqrt(5 ** 2 + 5 ** 2));
    });

    it('should return the distance between right and left of rects if first rect to the left of the second rect', () => {
      const rect1 = getRect({ position: { x: -10, y: 0 }, size: { width: 5, height: 5 } });
      const rect2 = getRect({ position: { x: 0, y: 0 }, size: { width: 5, height: 5 } });

      expect(getDistanceBetweenRects(rect1, rect2)).toBe(5);
    });
  });

  describe('isSamePoint', () => {
    it('should return true if the points are the same', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 0, y: 0 };

      expect(isSamePoint(point1, point2)).toBe(true);
    });

    it('should return false if the points are not the same', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 1, y: 1 };

      expect(isSamePoint(point1, point2)).toBe(false);
    });
  });

  describe('isSameSize', () => {
    it('should return true if the sizes are the same', () => {
      const size1 = { width: 10, height: 10 };
      const size2 = { width: 10, height: 10 };

      expect(isSameSize(size1, size2)).toBe(true);
    });

    it('should return false if the sizes are not the same', () => {
      const size1 = { width: 10, height: 10 };
      const size2 = { width: 15, height: 10 };

      expect(isSameSize(size1, size2)).toBe(false);
    });
  });

  describe('equalPointsArrays', () => {
    it('returns true for two empty arrays', () => {
      expect(equalPointsArrays([], [])).toBe(true);
    });

    it('returns true for arrays with identical points', () => {
      const a1 = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ];
      const a2 = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ];
      expect(equalPointsArrays(a1, a2)).toBe(true);
    });

    it('returns false for arrays of different lengths', () => {
      const a1 = [{ x: 1, y: 2 }];
      const a2 = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ];
      expect(equalPointsArrays(a1, a2)).toBe(false);
    });

    it('returns false when any point differs', () => {
      const a1 = [
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ];
      const a2 = [
        { x: 1, y: 2 },
        { x: 5, y: 6 },
      ];
      expect(equalPointsArrays(a1, a2)).toBe(false);
    });
  });

  describe('unionRect', () => {
    it('should return a zero rect for empty array', () => {
      const result = unionRect([]);

      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('should return the same rect for single rect', () => {
      const rect = getRect({ position: { x: 10, y: 20 }, size: { width: 30, height: 40 } });
      const result = unionRect([rect]);

      expect(result).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });

    it('should return union of two non-overlapping rects', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 20, y: 20 }, size: { width: 10, height: 10 } });
      const result = unionRect([rect1, rect2]);

      expect(result).toEqual({ x: 0, y: 0, width: 30, height: 30 });
    });

    it('should return union of two overlapping rects', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 20, height: 20 } });
      const rect2 = getRect({ position: { x: 10, y: 10 }, size: { width: 20, height: 20 } });
      const result = unionRect([rect1, rect2]);

      expect(result).toEqual({ x: 0, y: 0, width: 30, height: 30 });
    });

    it('should return union of multiple rects', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 20, y: 20 }, size: { width: 10, height: 10 } });
      const rect3 = getRect({ position: { x: 40, y: 40 }, size: { width: 10, height: 10 } });
      const result = unionRect([rect1, rect2, rect3]);

      expect(result).toEqual({ x: 0, y: 0, width: 50, height: 50 });
    });

    it('should handle negative coordinates', () => {
      const rect1 = getRect({ position: { x: -10, y: -10 }, size: { width: 10, height: 10 } });
      const rect2 = getRect({ position: { x: 10, y: 10 }, size: { width: 10, height: 10 } });
      const result = unionRect([rect1, rect2]);

      expect(result).toEqual({ x: -10, y: -10, width: 30, height: 30 });
    });

    it('should handle rect contained within another', () => {
      const rect1 = getRect({ position: { x: 0, y: 0 }, size: { width: 100, height: 100 } });
      const rect2 = getRect({ position: { x: 25, y: 25 }, size: { width: 50, height: 50 } });
      const result = unionRect([rect1, rect2]);

      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    });
  });

  describe('boundingRectOfPoints', () => {
    it('should return a zero rect for empty array', () => {
      const result = boundingRectOfPoints([]);

      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('should return a zero-sized rect for single point', () => {
      const result = boundingRectOfPoints([{ x: 10, y: 20 }]);

      expect(result).toEqual({ x: 10, y: 20, width: 0, height: 0 });
    });

    it('should return bounding rect for two points', () => {
      const result = boundingRectOfPoints([
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ]);

      expect(result).toEqual({ x: 0, y: 0, width: 10, height: 20 });
    });

    it('should return bounding rect for multiple points', () => {
      const result = boundingRectOfPoints([
        { x: 5, y: 10 },
        { x: 15, y: 30 },
        { x: 25, y: 20 },
        { x: 10, y: 5 },
      ]);

      expect(result).toEqual({ x: 5, y: 5, width: 20, height: 25 });
    });

    it('should handle negative coordinates', () => {
      const result = boundingRectOfPoints([
        { x: -10, y: -20 },
        { x: 10, y: 20 },
      ]);

      expect(result).toEqual({ x: -10, y: -20, width: 20, height: 40 });
    });

    it('should handle points in random order', () => {
      const result = boundingRectOfPoints([
        { x: 50, y: 50 },
        { x: 0, y: 0 },
        { x: 25, y: 75 },
        { x: 100, y: 25 },
      ]);

      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 75 });
    });

    it('should handle collinear points horizontally', () => {
      const result = boundingRectOfPoints([
        { x: 0, y: 10 },
        { x: 50, y: 10 },
        { x: 100, y: 10 },
      ]);

      expect(result).toEqual({ x: 0, y: 10, width: 100, height: 0 });
    });

    it('should handle collinear points vertically', () => {
      const result = boundingRectOfPoints([
        { x: 10, y: 0 },
        { x: 10, y: 50 },
        { x: 10, y: 100 },
      ]);

      expect(result).toEqual({ x: 10, y: 0, width: 0, height: 100 });
    });
  });

  describe('getRotatedCorners', () => {
    it('should return unrotated corners when angle is 0', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const corners = getRotatedCorners(rect, 0);

      expect(corners).toHaveLength(4);
      expect(corners[0]).toEqual({ x: 0, y: 0 });
      expect(corners[1]).toEqual({ x: 100, y: 0 });
      expect(corners[2]).toEqual({ x: 100, y: 50 });
      expect(corners[3]).toEqual({ x: 0, y: 50 });
    });

    it('should return unrotated corners when angle is undefined', () => {
      const rect = { x: 10, y: 20, width: 30, height: 40 };
      const corners = getRotatedCorners(rect);

      expect(corners).toHaveLength(4);
      expect(corners[0]).toEqual({ x: 10, y: 20 });
      expect(corners[1]).toEqual({ x: 40, y: 20 });
      expect(corners[2]).toEqual({ x: 40, y: 60 });
      expect(corners[3]).toEqual({ x: 10, y: 60 });
    });

    it('should rotate corners 90 degrees clockwise', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const corners = getRotatedCorners(rect, 90);

      // Center is at (50, 25)
      // After 90° rotation around center:
      // (0,0) -> (75, -25) relative to center -> (50+25, 25-50) = (75, -25)
      expect(corners[0].x).toBeCloseTo(75, 5);
      expect(corners[0].y).toBeCloseTo(-25, 5);
      expect(corners[1].x).toBeCloseTo(75, 5);
      expect(corners[1].y).toBeCloseTo(75, 5);
      expect(corners[2].x).toBeCloseTo(25, 5);
      expect(corners[2].y).toBeCloseTo(75, 5);
      expect(corners[3].x).toBeCloseTo(25, 5);
      expect(corners[3].y).toBeCloseTo(-25, 5);
    });

    it('should rotate corners 180 degrees', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const corners = getRotatedCorners(rect, 180);

      // 180° rotation flips the rectangle
      expect(corners[0].x).toBeCloseTo(100, 5);
      expect(corners[0].y).toBeCloseTo(50, 5);
      expect(corners[1].x).toBeCloseTo(0, 5);
      expect(corners[1].y).toBeCloseTo(50, 5);
      expect(corners[2].x).toBeCloseTo(0, 5);
      expect(corners[2].y).toBeCloseTo(0, 5);
      expect(corners[3].x).toBeCloseTo(100, 5);
      expect(corners[3].y).toBeCloseTo(0, 5);
    });

    it('should rotate corners 45 degrees', () => {
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const corners = getRotatedCorners(rect, 45);

      // For a square rotated 45°, corners should form a diamond
      // Center is at (50, 50), diagonal half-length is ~70.71
      const diagonal = (100 * Math.sqrt(2)) / 2;
      expect(corners[0].x).toBeCloseTo(50, 5);
      expect(corners[0].y).toBeCloseTo(50 - diagonal, 5);
      expect(corners[1].x).toBeCloseTo(50 + diagonal, 5);
      expect(corners[1].y).toBeCloseTo(50, 5);
      expect(corners[2].x).toBeCloseTo(50, 5);
      expect(corners[2].y).toBeCloseTo(50 + diagonal, 5);
      expect(corners[3].x).toBeCloseTo(50 - diagonal, 5);
      expect(corners[3].y).toBeCloseTo(50, 5);
    });

    it('should handle negative angles', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const cornersNegative = getRotatedCorners(rect, -90);
      const cornersPositive = getRotatedCorners(rect, 270);

      // -90° should be equivalent to 270°
      cornersNegative.forEach((corner, i) => {
        expect(corner.x).toBeCloseTo(cornersPositive[i].x, 5);
        expect(corner.y).toBeCloseTo(cornersPositive[i].y, 5);
      });
    });

    it('should handle 360 degree rotation as same as 0', () => {
      const rect = { x: 10, y: 20, width: 30, height: 40 };
      const corners0 = getRotatedCorners(rect, 0);
      const corners360 = getRotatedCorners(rect, 360);

      corners0.forEach((corner, i) => {
        expect(corner.x).toBeCloseTo(corners360[i].x, 5);
        expect(corner.y).toBeCloseTo(corners360[i].y, 5);
      });
    });

    it('should rotate around the center of the rectangle', () => {
      const rect = { x: 100, y: 100, width: 50, height: 50 };
      const corners = getRotatedCorners(rect, 45);

      // Center should remain at (125, 125)
      const centerX = corners.reduce((sum, c) => sum + c.x, 0) / 4;
      const centerY = corners.reduce((sum, c) => sum + c.y, 0) / 4;

      expect(centerX).toBeCloseTo(125, 5);
      expect(centerY).toBeCloseTo(125, 5);
    });
  });

  describe('getRotatedBoundingRect', () => {
    it('should return the same rect when angle is 0', () => {
      const rect = { x: 10, y: 20, width: 30, height: 40 };
      const result = getRotatedBoundingRect(rect, 0);

      expect(result).toEqual(rect);
    });

    it('should return the same rect when angle is undefined', () => {
      const rect = { x: 10, y: 20, width: 30, height: 40 };
      const result = getRotatedBoundingRect(rect);

      expect(result).toEqual(rect);
    });

    it('should return larger bounding rect for 45 degree rotation of a square', () => {
      const rect = { x: 0, y: 0, width: 100, height: 100 };
      const result = getRotatedBoundingRect(rect, 45);

      // A 100x100 square rotated 45° has a diagonal of ~141.42
      const diagonal = 100 * Math.sqrt(2);
      const expectedSize = diagonal;
      const offset = (diagonal - 100) / 2;

      expect(result.width).toBeCloseTo(expectedSize, 5);
      expect(result.height).toBeCloseTo(expectedSize, 5);
      expect(result.x).toBeCloseTo(-offset, 5);
      expect(result.y).toBeCloseTo(-offset, 5);
    });

    it('should swap width and height for 90 degree rotation of non-square', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const result = getRotatedBoundingRect(rect, 90);

      // Center is at (50, 25)
      // After 90° rotation, width becomes height and vice versa
      expect(result.width).toBeCloseTo(50, 5);
      expect(result.height).toBeCloseTo(100, 5);
    });

    it('should return same dimensions for 180 degree rotation', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const result = getRotatedBoundingRect(rect, 180);

      expect(result.width).toBeCloseTo(100, 5);
      expect(result.height).toBeCloseTo(50, 5);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should handle negative angles', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const resultNegative = getRotatedBoundingRect(rect, -45);
      const resultPositive = getRotatedBoundingRect(rect, 315);

      expect(resultNegative.x).toBeCloseTo(resultPositive.x, 5);
      expect(resultNegative.y).toBeCloseTo(resultPositive.y, 5);
      expect(resultNegative.width).toBeCloseTo(resultPositive.width, 5);
      expect(resultNegative.height).toBeCloseTo(resultPositive.height, 5);
    });

    it('should handle non-origin positioned rectangles', () => {
      const rect = { x: 100, y: 200, width: 50, height: 50 };
      const result = getRotatedBoundingRect(rect, 45);

      // Center is at (125, 225)
      const diagonal = 50 * Math.sqrt(2);
      const halfDiagonal = diagonal / 2;

      expect(result.x).toBeCloseTo(125 - halfDiagonal, 5);
      expect(result.y).toBeCloseTo(225 - halfDiagonal, 5);
      expect(result.width).toBeCloseTo(diagonal, 5);
      expect(result.height).toBeCloseTo(diagonal, 5);
    });

    it('should handle small rotation angles', () => {
      const rect = { x: 0, y: 0, width: 100, height: 50 };
      const result = getRotatedBoundingRect(rect, 5);

      // Small rotation should slightly increase bounding box
      expect(result.width).toBeGreaterThan(100);
      expect(result.height).toBeGreaterThan(50);
    });
  });
});
