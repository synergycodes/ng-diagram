import { describe, expect, it } from 'vitest';
import { PortSide } from '../../../../types';
import { computeBezierPoints } from '../compute-bezier-points';

describe('computeBezierPoints', () => {
  describe('edge cases', () => {
    it('should return empty array if source is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(computeBezierPoints(null as any, { x: 100, y: 100, side: 'left' as PortSide })).toEqual([]);
    });

    it('should return empty array if target is missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(computeBezierPoints({ x: 0, y: 0, side: 'right' as PortSide }, null as any)).toEqual([]);
    });

    it('should return empty array if both source and target are missing', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(computeBezierPoints(null as any, null as any)).toEqual([]);
    });
  });

  describe('horizontal connections', () => {
    it('should handle left to right connection', () => {
      const source = { x: 100, y: 200, side: 'right' as PortSide };
      const target = { x: 400, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 200, y: 200 }, // source control point (right +100)
        { x: 300, y: 200 }, // target control point (left -100)
        { x: 400, y: 200 }, // target point
      ]);
    });

    it('should handle right to left connection', () => {
      const source = { x: 400, y: 200, side: 'left' as PortSide };
      const target = { x: 100, y: 200, side: 'right' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 400, y: 200 }, // source point
        { x: 300, y: 200 }, // source control point (left -100)
        { x: 200, y: 200 }, // target control point (right +100)
        { x: 100, y: 200 }, // target point
      ]);
    });

    it('should handle same-side horizontal connections (both right)', () => {
      const source = { x: 100, y: 100, side: 'right' as PortSide };
      const target = { x: 300, y: 200, side: 'right' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 100 }, // source point
        { x: 200, y: 100 }, // source control point (right +100)
        { x: 400, y: 200 }, // target control point (right +100)
        { x: 300, y: 200 }, // target point
      ]);
    });

    it('should handle same-side horizontal connections (both left)', () => {
      const source = { x: 300, y: 100, side: 'left' as PortSide };
      const target = { x: 100, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 300, y: 100 }, // source point
        { x: 200, y: 100 }, // source control point (left -100)
        { x: 0, y: 200 }, // target control point (left -100)
        { x: 100, y: 200 }, // target point
      ]);
    });
  });

  describe('vertical connections', () => {
    it('should handle top to bottom connection', () => {
      const source = { x: 200, y: 100, side: 'bottom' as PortSide };
      const target = { x: 200, y: 400, side: 'top' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 200, y: 100 }, // source point
        { x: 200, y: 200 }, // source control point (bottom +100)
        { x: 200, y: 300 }, // target control point (top -100)
        { x: 200, y: 400 }, // target point
      ]);
    });

    it('should handle bottom to top connection', () => {
      const source = { x: 200, y: 400, side: 'top' as PortSide };
      const target = { x: 200, y: 100, side: 'bottom' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 200, y: 400 }, // source point
        { x: 200, y: 300 }, // source control point (top -100)
        { x: 200, y: 200 }, // target control point (bottom +100)
        { x: 200, y: 100 }, // target point
      ]);
    });

    it('should handle same-side vertical connections (both bottom)', () => {
      const source = { x: 100, y: 100, side: 'bottom' as PortSide };
      const target = { x: 200, y: 300, side: 'bottom' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 100 }, // source point
        { x: 100, y: 200 }, // source control point (bottom +100)
        { x: 200, y: 400 }, // target control point (bottom +100)
        { x: 200, y: 300 }, // target point
      ]);
    });

    it('should handle same-side vertical connections (both top)', () => {
      const source = { x: 100, y: 300, side: 'top' as PortSide };
      const target = { x: 200, y: 100, side: 'top' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 300 }, // source point
        { x: 100, y: 200 }, // source control point (top -100)
        { x: 200, y: 0 }, // target control point (top -100)
        { x: 200, y: 100 }, // target point
      ]);
    });
  });

  describe('diagonal connections', () => {
    it('should handle left to top connection', () => {
      const source = { x: 100, y: 200, side: 'left' as PortSide };
      const target = { x: 300, y: 100, side: 'top' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 0, y: 200 }, // source control point (left -100)
        { x: 300, y: 0 }, // target control point (top -100)
        { x: 300, y: 100 }, // target point
      ]);
    });

    it('should handle right to bottom connection', () => {
      const source = { x: 100, y: 100, side: 'right' as PortSide };
      const target = { x: 300, y: 300, side: 'bottom' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 100 }, // source point
        { x: 200, y: 100 }, // source control point (right +100)
        { x: 300, y: 400 }, // target control point (bottom +100)
        { x: 300, y: 300 }, // target point
      ]);
    });

    it('should handle top to left connection', () => {
      const source = { x: 200, y: 100, side: 'top' as PortSide };
      const target = { x: 400, y: 300, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 200, y: 100 }, // source point
        { x: 200, y: 0 }, // source control point (top -100)
        { x: 300, y: 300 }, // target control point (left -100)
        { x: 400, y: 300 }, // target point
      ]);
    });

    it('should handle bottom to right connection', () => {
      const source = { x: 100, y: 300, side: 'bottom' as PortSide };
      const target = { x: 400, y: 100, side: 'right' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 300 }, // source point
        { x: 100, y: 400 }, // source control point (bottom +100)
        { x: 500, y: 100 }, // target control point (right +100)
        { x: 400, y: 100 }, // target point
      ]);
    });
  });

  describe('custom offset values', () => {
    it('should handle custom positive offset', () => {
      const source = { x: 100, y: 200, side: 'right' as PortSide };
      const target = { x: 400, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target, 50);

      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 150, y: 200 }, // source control point (right +50)
        { x: 350, y: 200 }, // target control point (left -50)
        { x: 400, y: 200 }, // target point
      ]);
    });

    it('should handle zero offset (straight line behavior)', () => {
      const source = { x: 100, y: 200, side: 'right' as PortSide };
      const target = { x: 400, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target, 0);

      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 100, y: 200 }, // source control point (same as source)
        { x: 400, y: 200 }, // target control point (same as target)
        { x: 400, y: 200 }, // target point
      ]);
    });

    it('should handle negative offset (converts to positive)', () => {
      const source = { x: 100, y: 200, side: 'right' as PortSide };
      const target = { x: 400, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target, -50);

      // Negative offset is converted to positive using Math.abs
      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 150, y: 200 }, // source control point (right +50)
        { x: 350, y: 200 }, // target control point (left -50)
        { x: 400, y: 200 }, // target point
      ]);
    });

    it('should handle very large offset', () => {
      const source = { x: 100, y: 200, side: 'right' as PortSide };
      const target = { x: 400, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target, 1000);

      expect(result).toEqual([
        { x: 100, y: 200 }, // source point
        { x: 1100, y: 200 }, // source control point (right +1000)
        { x: -600, y: 200 }, // target control point (left -1000)
        { x: 400, y: 200 }, // target point
      ]);
    });
  });

  describe('special coordinate cases', () => {
    it('should handle negative coordinates', () => {
      const source = { x: -100, y: -200, side: 'right' as PortSide };
      const target = { x: -50, y: -150, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: -100, y: -200 }, // source point
        { x: 0, y: -200 }, // source control point
        { x: -150, y: -150 }, // target control point
        { x: -50, y: -150 }, // target point
      ]);
    });

    it('should handle fractional coordinates', () => {
      const source = { x: 100.5, y: 200.7, side: 'right' as PortSide };
      const target = { x: 400.3, y: 200.1, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100.5, y: 200.7 }, // source point
        { x: 200.5, y: 200.7 }, // source control point
        { x: 300.3, y: 200.1 }, // target control point
        { x: 400.3, y: 200.1 }, // target point
      ]);
    });

    it('should handle same position with different sides', () => {
      const source = { x: 200, y: 200, side: 'right' as PortSide };
      const target = { x: 200, y: 200, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 200, y: 200 }, // source point
        { x: 300, y: 200 }, // source control point (right +100)
        { x: 100, y: 200 }, // target control point (left -100)
        { x: 200, y: 200 }, // target point
      ]);
    });

    it('should handle very close points with small distance', () => {
      const source = { x: 100, y: 100, side: 'right' as PortSide };
      const target = { x: 101, y: 101, side: 'left' as PortSide };
      const result = computeBezierPoints(source, target);

      expect(result).toEqual([
        { x: 100, y: 100 }, // source point
        { x: 200, y: 100 }, // source control point (right +100)
        { x: 1, y: 101 }, // target control point (left -100)
        { x: 101, y: 101 }, // target point
      ]);
    });
  });
});
