import { describe, expect, it } from 'vitest';
import { Point } from '../../../../types';
import { computePolylinePointOnPath } from '../compute-polyline-point-on-path';

describe('computePolylinePointOnPath', () => {
  it('should return the single point for single-point array', () => {
    const points: Point[] = [{ x: 100, y: 50 }];

    expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 100, y: 50 });
    expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 100, y: 50 });
    expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 100, y: 50 });
  });

  it('should return default point for empty array', () => {
    const points: Point[] = [];

    expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 0, y: 0 });
  });

  describe('two-point paths (simple interpolation)', () => {
    it('should interpolate between two points horizontally', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 50, y: 0 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 100, y: 0 });
    });

    it('should interpolate between two points vertically', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
      ];

      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 0, y: 50 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 0, y: 100 });
    });

    it('should interpolate between two points diagonally', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ];

      expect(computePolylinePointOnPath(points, 0.25)).toEqual({ x: 25, y: 25 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 50, y: 50 });
      expect(computePolylinePointOnPath(points, 0.75)).toEqual({ x: 75, y: 75 });
    });

    it('should clamp negative percentages', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolylinePointOnPath(points, -0.5)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, -10)).toEqual({ x: 0, y: 0 });
    });

    it('should clamp percentages greater than 1', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ];

      expect(computePolylinePointOnPath(points, 1.5)).toEqual({ x: 100, y: 0 });
      expect(computePolylinePointOnPath(points, 10)).toEqual({ x: 100, y: 0 });
    });
  });

  describe('multi-point paths', () => {
    it('should handle L-shaped path with equal segments', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];

      // Total length: 100 + 100 = 200
      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, 0.25)).toEqual({ x: 50, y: 0 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 100, y: 0 });
      // Second segment
      expect(computePolylinePointOnPath(points, 0.75)).toEqual({ x: 100, y: 50 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 100, y: 100 });
    });

    it('should handle path with different segment lengths', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 300, y: 50 },
        { x: 300, y: 100 },
      ];

      // Segment lengths: 100, 50, 200, 50 = 400 total
      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 300, y: 100 });

      // 50% should be at total distance 200
      // First segment: 100, second: 50, so need 50 units into third segment
      const midPoint = computePolylinePointOnPath(points, 0.5);
      expect(midPoint.x).toBeCloseTo(150);
      expect(midPoint.y).toBe(50);
    });

    it('should handle path with unequal segments correctly', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 120, y: 0 },
        { x: 120, y: 60 },
        { x: 300, y: 60 },
        { x: 300, y: 100 },
      ];

      // Segment lengths: 120, 60, 180, 40 = 400 total
      // 4% should be 16 units along first segment
      expect(computePolylinePointOnPath(points, 0.04)).toEqual({ x: 16, y: 0 });

      // 50% should be at 200 units total distance
      // First segment: 120, second: 60, need 20 units into third segment
      const point = computePolylinePointOnPath(points, 0.5);
      expect(point.x).toBeCloseTo(140);
      expect(point.y).toBe(60);

      // 95% should be in the last segment
      const pointInLastSegment = computePolylinePointOnPath(points, 0.95);
      expect(pointInLastSegment.x).toBe(300);
      expect(pointInLastSegment.y).toBeCloseTo(80);
    });

    it('should handle path with equal segments', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 200, y: 0 },
      ];

      // Each segment is 100 units, total 200
      const endFirst = computePolylinePointOnPath(points, 1 / 3);
      expect(endFirst.x).toBeCloseTo(66.67, 1);
      expect(endFirst.y).toBe(0);

      // Middle point should be at the second vertex
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 100, y: 0 });

      const endSecond = computePolylinePointOnPath(points, 2 / 3);
      expect(endSecond.x).toBeCloseTo(133.33, 1);
      expect(endSecond.y).toBe(0);
    });

    it('should handle very small percentage values', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 10000, y: 0 },
        { x: 10000, y: 10000 },
        { x: 0, y: 10000 },
        { x: 0, y: 0 },
      ];

      // Very small percentage should be very close to start
      const veryEarly = computePolylinePointOnPath(points, 0.0001);
      expect(veryEarly.x).toBeCloseTo(4, 0);
      expect(veryEarly.y).toBe(0);
    });

    it('should handle large coordinate values', () => {
      const points: Point[] = [
        { x: 10000, y: 10000 },
        { x: 10100, y: 10000 },
        { x: 10100, y: 10100 },
      ];

      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 10000, y: 10000 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 10100, y: 10000 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 10100, y: 10100 });
    });

    it('should handle square path', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
        { x: 0, y: 0 },
      ];

      // Each side is 100 units, total 400
      expect(computePolylinePointOnPath(points, 0)).toEqual({ x: 0, y: 0 });
      expect(computePolylinePointOnPath(points, 0.25)).toEqual({ x: 100, y: 0 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 100, y: 100 });
      expect(computePolylinePointOnPath(points, 0.75)).toEqual({ x: 0, y: 100 });
      expect(computePolylinePointOnPath(points, 1)).toEqual({ x: 0, y: 0 });
    });

    it('should handle path with zero-length segments', () => {
      const points: Point[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 0 }, // Duplicate point
        { x: 100, y: 100 },
      ];

      // Segments: 100, 0, 100 = 200 total (zero-length segment ignored)
      expect(computePolylinePointOnPath(points, 0.25)).toEqual({ x: 50, y: 0 });
      expect(computePolylinePointOnPath(points, 0.5)).toEqual({ x: 100, y: 0 });
      expect(computePolylinePointOnPath(points, 0.75)).toEqual({ x: 100, y: 50 });
    });
  });
});
