import { describe, expect, it } from 'vitest';
import { Point } from '../../../../types';
import { computePolynomialPointOnPath } from '../compute-polynomial-point-on-path';

describe('computePolynomialPointOnPath', () => {
  describe('edge cases', () => {
    it('should return the only point for single-point array', () => {
      const points: Point[] = [{ x: 100, y: 50 }];
      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 100, y: 50 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 100, y: 50 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 100, y: 50 });
    });

    it('should return default point for empty array', () => {
      const points: Point[] = [];
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 0, y: 0 });
    });

    it('should handle two-point line segment', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 50, y: 0 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 100, y: 0 });
    });
  });

  describe('percentage clamping', () => {
    it('should clamp negative percentages to 0', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolynomialPointOnPath(points, -0.5)).toEqual({ x: 0, y: 0 });
      expect(computePolynomialPointOnPath(points, -10)).toEqual({ x: 0, y: 0 });
    });

    it('should clamp percentages greater than 1 to 1', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolynomialPointOnPath(points, 1.5)).toEqual({ x: 100, y: 0 });
      expect(computePolynomialPointOnPath(points, 10)).toEqual({ x: 100, y: 0 });
    });
  });

  describe('multi-segment paths', () => {
    it('should handle L-shaped path correctly', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];
      // Total length: 100 + 100 = 200

      // First segment
      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.25)).toEqual({ x: 50, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 100, y: 0 });

      // Second segment
      expect(computePolynomialPointOnPath(points, 0.75)).toEqual({ x: 100, y: 50 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 100, y: 100 });
    });

    it('should handle zigzag path correctly', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 0 },
        { x: 300, y: 100 },
      ];
      // Each segment has length sqrt(100^2 + 100^2) ≈ 141.42
      // Total length ≈ 424.26

      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 300, y: 100 });

      // Middle of the path should be on the second segment
      const midPoint = computePolynomialPointOnPath(points, 0.5);
      expect(midPoint.x).toBeGreaterThan(100);
      expect(midPoint.x).toBeLessThan(200);
    });

    it('should handle path with different segment lengths', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 }, // Short segment: 10
        { x: 110, y: 0 }, // Long segment: 100
        { x: 110, y: 10 }, // Short segment: 10
      ];
      // Total length: 10 + 100 + 10 = 120

      // Should be in first segment (10/120 ≈ 0.083)
      expect(computePolynomialPointOnPath(points, 0.04)).toEqual({ x: 4.8, y: 0 });

      // Should be in second segment (at 60/120 = 0.5)
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 60, y: 0 });

      // Should be in third segment (at 115/120 ≈ 0.958)
      const pointInLastSegment = computePolynomialPointOnPath(points, 0.958);
      expect(pointInLastSegment.x).toBeCloseTo(110, 1);
      expect(pointInLastSegment.y).toBeCloseTo(5, 1);
    });
  });

  describe('diagonal segments', () => {
    it('should interpolate correctly on diagonal line', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      expect(computePolynomialPointOnPath(points, 0.25)).toEqual({ x: 25, y: 25 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 50, y: 50 });
      expect(computePolynomialPointOnPath(points, 0.75)).toEqual({ x: 75, y: 75 });
    });

    it('should handle mixed horizontal, vertical, and diagonal segments', () => {
      const points: Point[] = [
        { x: 0, y: 0 }, // Start
        { x: 100, y: 0 }, // Horizontal segment
        { x: 100, y: 100 }, // Vertical segment
        { x: 0, y: 100 }, // Horizontal segment back
      ];
      // All segments have length 100, total = 300

      // End of first segment (100/300 ≈ 0.333)
      const endFirst = computePolynomialPointOnPath(points, 1 / 3);
      expect(endFirst.x).toBeCloseTo(100, 1);
      expect(endFirst.y).toBeCloseTo(0, 1);

      // Middle of second segment (150/300 = 0.5)
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 100, y: 50 });

      // End of second segment (200/300 ≈ 0.667)
      const endSecond = computePolynomialPointOnPath(points, 2 / 3);
      expect(endSecond.x).toBeCloseTo(100, 1);
      expect(endSecond.y).toBeCloseTo(100, 1);
    });
  });

  describe('precision and rounding', () => {
    it('should handle very small segments', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 0.1, y: 0 },
        { x: 100, y: 0 },
      ];
      // First segment: 0.1, Second segment: 99.9, Total: 100

      // Should still be in first segment at 0.0005 (0.05/100)
      const veryEarly = computePolynomialPointOnPath(points, 0.0005);
      expect(veryEarly.x).toBeCloseTo(0.05, 3);
      expect(veryEarly.y).toBe(0);
    });

    it('should maintain precision with large coordinates', () => {
      const points: Point[] = [
        { x: 10000, y: 10000 },
        { x: 10100, y: 10000 },
        { x: 10100, y: 10100 },
      ];

      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 10000, y: 10000 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 10100, y: 10000 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 10100, y: 10100 });
    });
  });

  describe('special patterns', () => {
    it('should handle closed loop path', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 }, // Back to start
      ];
      // Total perimeter: 400

      expect(computePolynomialPointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.25)).toEqual({ x: 100, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 100, y: 100 });
      expect(computePolynomialPointOnPath(points, 0.75)).toEqual({ x: 0, y: 100 });
      expect(computePolynomialPointOnPath(points, 1)).toEqual({ x: 0, y: 0 });
    });

    it('should handle path with duplicate consecutive points', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 0 }, // Duplicate point (zero-length segment)
        { x: 100, y: 0 },
      ];
      // Segments: 50, 0, 50; Total: 100

      expect(computePolynomialPointOnPath(points, 0.25)).toEqual({ x: 25, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.5)).toEqual({ x: 50, y: 0 });
      expect(computePolynomialPointOnPath(points, 0.75)).toEqual({ x: 75, y: 0 });
    });
  });
});
