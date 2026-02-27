import { describe, expect, it } from 'vitest';
import { computeLinearSegmentLengths, interpolateAlongLinearSegments } from '../linear-segment-utils';

describe('computeLinearSegmentLengths', () => {
  it('should return empty lengths for a single point', () => {
    const result = computeLinearSegmentLengths([{ x: 0, y: 0 }]);
    expect(result.lengths).toEqual([]);
    expect(result.totalLength).toBe(0);
  });

  it('should compute length of a single horizontal segment', () => {
    const result = computeLinearSegmentLengths([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(result.lengths).toEqual([100]);
    expect(result.totalLength).toBe(100);
  });

  it('should compute length of a diagonal segment', () => {
    const result = computeLinearSegmentLengths([
      { x: 0, y: 0 },
      { x: 30, y: 40 },
    ]);
    expect(result.lengths).toEqual([50]);
    expect(result.totalLength).toBe(50);
  });

  it('should compute lengths for multiple segments', () => {
    const result = computeLinearSegmentLengths([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(result.lengths).toEqual([100, 100]);
    expect(result.totalLength).toBe(200);
  });

  it('should handle zero-length segments', () => {
    const result = computeLinearSegmentLengths([
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ]);
    expect(result.lengths).toEqual([0, 100]);
    expect(result.totalLength).toBe(100);
  });

  it('should return empty lengths for empty points array', () => {
    const result = computeLinearSegmentLengths([]);
    expect(result.lengths).toEqual([]);
    expect(result.totalLength).toBe(0);
  });
});

describe('interpolateAlongLinearSegments', () => {
  describe('single segment', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ];
    const lengths = [100];

    it('should return start point at distance 0', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 0)).toEqual({ x: 0, y: 0 });
    });

    it('should return midpoint at half distance', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 50)).toEqual({ x: 50, y: 0 });
    });

    it('should return end point at full distance', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 100)).toEqual({ x: 100, y: 0 });
    });
  });

  describe('multi-segment path', () => {
    // L-shaped: 100px horizontal + 100px vertical
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
    ];
    const lengths = [100, 100];

    it('should find point on first segment', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 50)).toEqual({ x: 50, y: 0 });
    });

    it('should find point at the corner', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 100)).toEqual({ x: 100, y: 0 });
    });

    it('should find point on second segment', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 150)).toEqual({ x: 100, y: 50 });
    });

    it('should return last point when target equals total length', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 200)).toEqual({ x: 100, y: 100 });
    });
  });

  describe('zero-length segment', () => {
    const points = [
      { x: 50, y: 50 },
      { x: 50, y: 50 },
      { x: 150, y: 50 },
    ];
    const lengths = [0, 100];

    it('should skip zero-length segment and interpolate on next', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 50)).toEqual({ x: 100, y: 50 });
    });

    it('should return first point at distance 0 (zero-length segment)', () => {
      expect(interpolateAlongLinearSegments(points, lengths, 0)).toEqual({ x: 50, y: 50 });
    });
  });

  describe('diagonal segment', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 30, y: 40 },
    ];
    const lengths = [50];

    it('should interpolate correctly along diagonal', () => {
      const result = interpolateAlongLinearSegments(points, lengths, 25);
      expect(result.x).toBeCloseTo(15);
      expect(result.y).toBeCloseTo(20);
    });
  });
});
