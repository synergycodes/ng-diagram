import { describe, expect, it } from 'vitest';
import {
  doesRectsIntersect,
  getDistanceBetweenRects,
  getPointRangeRect,
  getRect,
  isSamePoint,
  isSameRect,
  isSameSize,
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
});
