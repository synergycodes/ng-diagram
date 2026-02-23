import { describe, expect, it } from 'vitest';
import { computePolylinePointAtDistance } from '../compute-polyline-point-at-distance';

describe('computePolylinePointAtDistance', () => {
  describe('edge cases', () => {
    it('should return { x: 0, y: 0 } for empty path', () => {
      expect(computePolylinePointAtDistance([], 50)).toEqual({ x: 0, y: 0 });
    });

    it('should return the single point for single point path', () => {
      expect(computePolylinePointAtDistance([{ x: 42, y: 24 }], 50)).toEqual({ x: 42, y: 24 });
    });
  });

  describe('straight path (two points)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should return correct point at given distance', () => {
      expect(computePolylinePointAtDistance(path, 30)).toEqual({ x: 30, y: 0 });
    });

    it('should return start point at distance 0', () => {
      expect(computePolylinePointAtDistance(path, 0)).toEqual({ x: 0, y: 0 });
    });

    it('should return end point at full path length', () => {
      expect(computePolylinePointAtDistance(path, 100)).toEqual({ x: 100, y: 0 });
    });

    it('should clamp to end when distance exceeds path length', () => {
      expect(computePolylinePointAtDistance(path, 500)).toEqual({ x: 100, y: 0 });
    });

    it('should clamp to start when distance is negative beyond path length', () => {
      expect(computePolylinePointAtDistance(path, -500)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('negative distance (from target end)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should measure from end with negative value', () => {
      expect(computePolylinePointAtDistance(path, -20)).toEqual({ x: 80, y: 0 });
    });

    it('should handle -0 as 0 from start', () => {
      expect(computePolylinePointAtDistance(path, -0)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('multi-segment path', () => {
    // L-shaped: total = 100 + 100 = 200
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    it('should find point on first segment', () => {
      expect(computePolylinePointAtDistance(path, 50)).toEqual({ x: 50, y: 0 });
    });

    it('should find point at the corner', () => {
      expect(computePolylinePointAtDistance(path, 100)).toEqual({ x: 100, y: 0 });
    });

    it('should find point on second segment', () => {
      expect(computePolylinePointAtDistance(path, 150)).toEqual({ x: 100, y: 50 });
    });

    it('should handle negative distance on multi-segment path', () => {
      // -30 means 30px from end => 200 - 30 = 170px from start
      expect(computePolylinePointAtDistance(path, -30)).toEqual({ x: 100, y: 70 });
    });
  });

  describe('diagonal path', () => {
    // Diagonal: length = sqrt(30^2 + 40^2) = 50
    const path = [
      { x: 0, y: 0 },
      { x: 30, y: 40 },
    ];

    it('should compute correct point along diagonal', () => {
      const result = computePolylinePointAtDistance(path, 25);
      // 25/50 = 0.5 along path
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(20);
    });

    it('should handle negative distance on diagonal', () => {
      const result = computePolylinePointAtDistance(path, -25);
      // -25 on 50px path => 25px from start => 50% of path
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(20);
    });
  });

  describe('zero-length segment handling', () => {
    const path = [
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ];

    it('should skip zero-length segment and find point on next segment', () => {
      expect(computePolylinePointAtDistance(path, 50)).toEqual({ x: 100, y: 50 });
    });
  });
});
