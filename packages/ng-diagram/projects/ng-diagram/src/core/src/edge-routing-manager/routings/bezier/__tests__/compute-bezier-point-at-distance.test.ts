import { describe, expect, it } from 'vitest';
import { computeBezierPointAtDistance } from '../compute-bezier-point-at-distance';

describe('computeBezierPointAtDistance', () => {
  describe('edge cases', () => {
    it('should return { x: 0, y: 0 } for empty path', () => {
      expect(computeBezierPointAtDistance([], 50)).toEqual({ x: 0, y: 0 });
    });

    it('should return the single point for single point path', () => {
      expect(computeBezierPointAtDistance([{ x: 42, y: 24 }], 50)).toEqual({ x: 42, y: 24 });
    });
  });

  describe('linear path (two points)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should return start point at distance 0', () => {
      const result = computeBezierPointAtDistance(path, 0);
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should return end point at full path length', () => {
      const result = computeBezierPointAtDistance(path, 100);
      expect(result.x).toBeCloseTo(100, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should return midpoint at half path length', () => {
      const result = computeBezierPointAtDistance(path, 50);
      expect(result.x).toBeCloseTo(50, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should clamp to end when distance exceeds path length', () => {
      const result = computeBezierPointAtDistance(path, 500);
      expect(result.x).toBeCloseTo(100, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should clamp to start when distance is negative beyond path length', () => {
      const result = computeBezierPointAtDistance(path, -500);
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });
  });

  describe('negative distance (from target end)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should measure from end with negative value', () => {
      const result = computeBezierPointAtDistance(path, -20);
      expect(result.x).toBeCloseTo(80, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });
  });

  describe('cubic bezier curve', () => {
    // A simple cubic bezier with control points that form a known shape
    const cubicPath = [
      { x: 0, y: 0 },
      { x: 0, y: 100 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
    ];

    it('should return start point at distance 0', () => {
      const result = computeBezierPointAtDistance(cubicPath, 0);
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should return end point at large distance', () => {
      const result = computeBezierPointAtDistance(cubicPath, 10000);
      expect(result.x).toBeCloseTo(100, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should return a point on the curve at given distance', () => {
      // At 20px from start, the point should be somewhere on the curve
      const result = computeBezierPointAtDistance(cubicPath, 20);
      expect(result.x).toBeGreaterThanOrEqual(0);
      expect(result.x).toBeLessThanOrEqual(100);
      expect(result.y).toBeGreaterThanOrEqual(0);
      expect(result.y).toBeLessThanOrEqual(100);
    });

    it('should produce a point closer to start than end for small distance', () => {
      const nearStart = computeBezierPointAtDistance(cubicPath, 10);
      const nearEnd = computeBezierPointAtDistance(cubicPath, -10);

      // Near start should be close to (0,0), near end should be close to (100,0)
      expect(nearStart.x).toBeLessThan(50);
      expect(nearEnd.x).toBeGreaterThan(50);
    });

    it('should produce points that progress along the curve as distance increases', () => {
      const p1 = computeBezierPointAtDistance(cubicPath, 20);
      const p2 = computeBezierPointAtDistance(cubicPath, 40);
      const p3 = computeBezierPointAtDistance(cubicPath, 60);

      // Due to the S-shape of this curve, x should generally increase
      expect(p2.x).toBeGreaterThanOrEqual(p1.x);
      expect(p3.x).toBeGreaterThanOrEqual(p2.x);
    });
  });

  describe('quadratic bezier (three points)', () => {
    const quadPath = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];

    it('should return start at distance 0', () => {
      const result = computeBezierPointAtDistance(quadPath, 0);
      expect(result.x).toBeCloseTo(0, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should return end at large distance', () => {
      const result = computeBezierPointAtDistance(quadPath, 10000);
      expect(result.x).toBeCloseTo(100, 0);
      expect(result.y).toBeCloseTo(0, 0);
    });

    it('should handle negative distance', () => {
      const result = computeBezierPointAtDistance(quadPath, -10);
      // Should be near the end point
      expect(result.x).toBeGreaterThan(80);
    });
  });
});
