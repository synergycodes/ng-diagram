import { describe, expect, it } from 'vitest';
import { Point } from '../../../../types';
import { computeBezierPath } from '../compute-bezier-path';

describe('computeBezierPath', () => {
  describe('edge cases', () => {
    it('should return empty string for null or undefined', () => {
      expect(computeBezierPath(null)).toBe('');
      expect(computeBezierPath(undefined)).toBe('');
    });

    it('should return empty string for empty array', () => {
      expect(computeBezierPath([])).toBe('');
    });
  });

  describe('single point', () => {
    it('should generate move command for single point', () => {
      const points: Point[] = [{ x: 100, y: 200 }];
      expect(computeBezierPath(points)).toBe('M 100,200');
    });

    it('should handle negative coordinates', () => {
      const points: Point[] = [{ x: -50, y: -100 }];
      expect(computeBezierPath(points)).toBe('M -50,-100');
    });

    it('should handle decimal coordinates', () => {
      const points: Point[] = [{ x: 100.5, y: 200.75 }];
      expect(computeBezierPath(points)).toBe('M 100.5,200.75');
    });
  });

  describe('two points (straight line)', () => {
    it('should generate line path for two points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 L 100,100');
    });

    it('should handle horizontal line', () => {
      const points: Point[] = [
        { x: 50, y: 100 },
        { x: 150, y: 100 },
      ];
      expect(computeBezierPath(points)).toBe('M 50,100 L 150,100');
    });

    it('should handle vertical line', () => {
      const points: Point[] = [
        { x: 100, y: 50 },
        { x: 100, y: 250 },
      ];
      expect(computeBezierPath(points)).toBe('M 100,50 L 100,250');
    });

    it('should handle negative coordinates in line', () => {
      const points: Point[] = [
        { x: -50, y: -50 },
        { x: 50, y: 50 },
      ];
      expect(computeBezierPath(points)).toBe('M -50,-50 L 50,50');
    });
  });

  describe('three points (quadratic bezier)', () => {
    it('should generate quadratic bezier path for three points', () => {
      const points: Point[] = [
        { x: 0, y: 100 }, // start
        { x: 50, y: 0 }, // control
        { x: 100, y: 100 }, // end
      ];
      expect(computeBezierPath(points)).toBe('M 0,100 Q 50,0 100,100');
    });

    it('should handle negative control point', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: -50, y: -50 },
        { x: 100, y: 0 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 Q -50,-50 100,0');
    });
  });

  describe('four points (cubic bezier)', () => {
    it('should generate cubic bezier path for four points', () => {
      const points: Point[] = [
        { x: 0, y: 100 }, // start
        { x: 25, y: 0 }, // control1
        { x: 75, y: 0 }, // control2
        { x: 100, y: 100 }, // end
      ];
      expect(computeBezierPath(points)).toBe('M 0,100 C 25,0 75,0 100,100');
    });

    it('should handle standard horizontal bezier connection', () => {
      const points: Point[] = [
        { x: 100, y: 200 }, // source
        { x: 200, y: 200 }, // source control
        { x: 300, y: 200 }, // target control
        { x: 400, y: 200 }, // target
      ];
      expect(computeBezierPath(points)).toBe('M 100,200 C 200,200 300,200 400,200');
    });

    it('should handle vertical bezier connection', () => {
      const points: Point[] = [
        { x: 200, y: 100 }, // source
        { x: 200, y: 200 }, // source control
        { x: 200, y: 300 }, // target control
        { x: 200, y: 400 }, // target
      ];
      expect(computeBezierPath(points)).toBe('M 200,100 C 200,200 200,300 200,400');
    });

    it('should handle diagonal bezier connection', () => {
      const points: Point[] = [
        { x: 0, y: 0 }, // source
        { x: 100, y: 0 }, // source control
        { x: 100, y: 100 }, // target control
        { x: 200, y: 100 }, // target
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 C 100,0 100,100 200,100');
    });

    it('should handle bezier with negative coordinates', () => {
      const points: Point[] = [
        { x: -100, y: -100 },
        { x: 0, y: -100 },
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];
      expect(computeBezierPath(points)).toBe('M -100,-100 C 0,-100 0,0 100,0');
    });

    it('should handle bezier with decimal coordinates', () => {
      const points: Point[] = [
        { x: 10.5, y: 20.5 },
        { x: 30.25, y: 40.75 },
        { x: 50.125, y: 60.875 },
        { x: 70.5, y: 80.5 },
      ];
      expect(computeBezierPath(points)).toBe('M 10.5,20.5 C 30.25,40.75 50.125,60.875 70.5,80.5');
    });
  });

  describe('more than four points (polyline fallback)', () => {
    it('should generate polyline for five points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 25, y: 50 },
        { x: 50, y: 25 },
        { x: 75, y: 75 },
        { x: 100, y: 100 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 L 25,50 L 50,25 L 75,75 L 100,100');
    });

    it('should handle many points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
        { x: 20, y: 5 },
        { x: 30, y: 15 },
        { x: 40, y: 10 },
        { x: 50, y: 20 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 L 10,10 L 20,5 L 30,15 L 40,10 L 50,20');
    });
  });

  describe('special cases', () => {
    it('should handle points at origin', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,0 C 0,0 0,0 0,0');
    });

    it('should handle very large coordinates', () => {
      const points: Point[] = [
        { x: 10000, y: 20000 },
        { x: 30000, y: 40000 },
      ];
      expect(computeBezierPath(points)).toBe('M 10000,20000 L 30000,40000');
    });

    it('should handle very small decimal coordinates', () => {
      const points: Point[] = [
        { x: 0.001, y: 0.002 },
        { x: 0.003, y: 0.004 },
      ];
      expect(computeBezierPath(points)).toBe('M 0.001,0.002 L 0.003,0.004');
    });

    it('should handle mixed positive and negative coordinates', () => {
      const points: Point[] = [
        { x: -100, y: 50 },
        { x: 0, y: 0 },
        { x: 50, y: -25 },
        { x: 100, y: -100 },
      ];
      expect(computeBezierPath(points)).toBe('M -100,50 C 0,0 50,-25 100,-100');
    });

    it('should handle zero coordinates mixed with non-zero', () => {
      const points: Point[] = [
        { x: 0, y: 100 },
        { x: 50, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 0 },
      ];
      expect(computeBezierPath(points)).toBe('M 0,100 C 50,0 0,50 100,0');
    });
  });
});
