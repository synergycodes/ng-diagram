import { describe, expect, it } from 'vitest';
import { computeOrthogonalPointAtDistance } from '../compute-orthogonal-point-at-distance';

describe('computeOrthogonalPointAtDistance', () => {
  describe('edge cases', () => {
    it('should return { x: 0, y: 0 } for empty path', () => {
      expect(computeOrthogonalPointAtDistance([], 50)).toEqual({ x: 0, y: 0 });
    });

    it('should return { x: 0, y: 0 } for single point path', () => {
      expect(computeOrthogonalPointAtDistance([{ x: 42, y: 24 }], 50)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('straight path (two points)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should return correct point at given distance', () => {
      expect(computeOrthogonalPointAtDistance(path, 30)).toEqual({ x: 30, y: 0 });
    });

    it('should return start point at distance 0', () => {
      expect(computeOrthogonalPointAtDistance(path, 0)).toEqual({ x: 0, y: 0 });
    });

    it('should return end point at full path length', () => {
      expect(computeOrthogonalPointAtDistance(path, 100)).toEqual({ x: 100, y: 0 });
    });

    it('should clamp to end when distance exceeds path length', () => {
      expect(computeOrthogonalPointAtDistance(path, 500)).toEqual({ x: 100, y: 0 });
    });

    it('should clamp to start when distance is negative beyond path length', () => {
      expect(computeOrthogonalPointAtDistance(path, -500)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('negative distance (from target end)', () => {
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];

    it('should measure from end with negative value', () => {
      expect(computeOrthogonalPointAtDistance(path, -20)).toEqual({ x: 80, y: 0 });
    });

    it('should return end point at -0', () => {
      // -0 is treated as "from target end", so totalLength + (-0) = totalLength
      expect(computeOrthogonalPointAtDistance(path, -0)).toEqual({ x: 100, y: 0 });
    });
  });

  describe('L-shaped path', () => {
    // Total length = 100 + 100 = 200
    const path = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];

    it('should find point on first segment', () => {
      expect(computeOrthogonalPointAtDistance(path, 50)).toEqual({ x: 50, y: 0 });
    });

    it('should find point at the corner', () => {
      expect(computeOrthogonalPointAtDistance(path, 100)).toEqual({ x: 100, y: 0 });
    });

    it('should find point on second segment', () => {
      expect(computeOrthogonalPointAtDistance(path, 150)).toEqual({ x: 100, y: 50 });
    });

    it('should handle negative distance on L-shaped path', () => {
      // -30 means 30px from end => 200 - 30 = 170px from start => on second segment at 70px
      expect(computeOrthogonalPointAtDistance(path, -30)).toEqual({ x: 100, y: 70 });
    });
  });

  describe('Z-shaped path', () => {
    // Total: 50 + 100 + 50 = 200
    const path = [
      { x: 0, y: 0 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
    ];

    it('should find point on middle segment', () => {
      // 100px from start: 50px on first seg + 50px on second seg
      expect(computeOrthogonalPointAtDistance(path, 100)).toEqual({ x: 50, y: 50 });
    });

    it('should find point on last segment', () => {
      // 180px from start: 50 + 100 + 30 = 180
      expect(computeOrthogonalPointAtDistance(path, 180)).toEqual({ x: 100, y: 80 });
    });
  });

  describe('zero-length segment handling', () => {
    const path = [
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ];

    it('should skip zero-length segment and find point on next segment', () => {
      expect(computeOrthogonalPointAtDistance(path, 50)).toEqual({ x: 100, y: 50 });
    });
  });
});
