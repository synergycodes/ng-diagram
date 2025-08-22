import { describe, expect, it } from 'vitest';
import { computeOrthogonalPointOnPath } from '../compute-orthogonal-point-on-path';

describe('computeOrthogonalPointOnPath', () => {
  it('should return the point on the straight path', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      0.5
    );
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should return x: 0 y: 0 if the path is empty', () => {
    const point = computeOrthogonalPointOnPath([], 0.5);
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return x: 0 y: 0 if the path has only one point', () => {
    const point = computeOrthogonalPointOnPath([{ x: 42, y: 24 }], 0.5);
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the beginning of the path if the percentage is less than 0', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      -0.5
    );
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the beginning of the path if the percentage is exactly 0', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      0
    );
    expect(point).toEqual({ x: 10, y: 20 });
  });

  it('should return the end of the path if the percentage is greater than 1', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      1.5
    );
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should return the end of the path if the percentage is exactly 1', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      1
    );
    expect(point).toEqual({ x: 30, y: 40 });
  });

  it('should return x: 0 y: 0 if the percentage is negative and path has only one point', () => {
    const point = computeOrthogonalPointOnPath([{ x: 42, y: 24 }], -1);
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return proper point if path has more than 2 points', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      0.25
    );
    expect(point).toEqual({ x: 75, y: 0 });
  });

  it('should return the point on the second segment for percentage beyond the first segment', () => {
    const point = computeOrthogonalPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      0.75
    );
    expect(point).toEqual({ x: 100, y: 50 });
  });

  it('should return the last point if percentage is NaN', () => {
    const points = [
      { x: 5, y: 5 },
      { x: 15, y: 20 },
      { x: 25, y: 25 },
    ];
    const point = computeOrthogonalPointOnPath(points, NaN);
    // NaN percentage falls through the loop and returns the last point
    expect(point).toEqual({ x: 25, y: 25 });
  });

  describe('orthogonal path specific cases', () => {
    it('should handle L-shaped orthogonal path correctly', () => {
      // Typical L-shape: horizontal then vertical
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ];

      // At 25% should be on horizontal segment
      expect(computeOrthogonalPointOnPath(points, 0.25)).toEqual({ x: 50, y: 0 });

      // At 50% should be at the corner
      expect(computeOrthogonalPointOnPath(points, 0.5)).toEqual({ x: 100, y: 0 });

      // At 75% should be on vertical segment
      expect(computeOrthogonalPointOnPath(points, 0.75)).toEqual({ x: 100, y: 50 });
    });

    it('should handle Z-shaped orthogonal path', () => {
      // Z-shape: right, down, right
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 50 },
      ];

      // Total length: 50 + 50 + 50 = 150
      // At 1/3 should be at first corner
      const point1 = computeOrthogonalPointOnPath(points, 1 / 3);
      expect(point1.x).toBeCloseTo(50, 1);
      expect(point1.y).toBeCloseTo(0, 1);

      // At 2/3 should be at second corner
      const point2 = computeOrthogonalPointOnPath(points, 2 / 3);
      expect(point2.x).toBeCloseTo(50, 1);
      expect(point2.y).toBeCloseTo(50, 1);
    });

    it('should handle rectangular path', () => {
      // Rectangle path
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 50 },
        { x: 0, y: 50 },
        { x: 0, y: 0 },
      ];

      // Total perimeter: 100 + 50 + 100 + 50 = 300
      // At 25% = 75 units along path = 75 on first segment
      const point1 = computeOrthogonalPointOnPath(points, 0.25);
      expect(point1.x).toBeCloseTo(75, 1);
      expect(point1.y).toBeCloseTo(0, 1);

      // At 50% = 150 units along path = second corner
      const point2 = computeOrthogonalPointOnPath(points, 0.5);
      expect(point2.x).toBeCloseTo(100, 1);
      expect(point2.y).toBeCloseTo(50, 1);
    });
  });

  describe('edge cases with segments', () => {
    it('should handle zero-length segments', () => {
      // Path with duplicate points (zero-length segments)
      const points = [
        { x: 0, y: 0 },
        { x: 0, y: 0 }, // Duplicate
        { x: 100, y: 0 },
        { x: 100, y: 0 }, // Duplicate
        { x: 100, y: 100 },
      ];

      // Should skip zero-length segments
      const point = computeOrthogonalPointOnPath(points, 0.5);
      expect(point).toEqual({ x: 100, y: 0 });
    });

    it('should handle very small segments', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 0.001, y: 0 }, // Very small horizontal
        { x: 100, y: 0 },
      ];

      // Should still interpolate correctly
      const point = computeOrthogonalPointOnPath(points, 0.5);
      expect(point.x).toBeCloseTo(50, 0);
      expect(point.y).toBe(0);
    });

    it('should handle percentage exactly at segment boundaries', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 30 },
        { x: 0, y: 30 },
      ];

      // Total length: 40 + 30 + 40 = 110
      // At 40/110 should be exactly at first corner
      const percentage = 40 / 110;
      const point = computeOrthogonalPointOnPath(points, percentage);
      expect(point).toEqual({ x: 40, y: 0 });
    });

    it('should handle single segment path', () => {
      const points = [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ];

      // Should interpolate along the single segment
      const point = computeOrthogonalPointOnPath(points, 0.25);
      expect(point).toEqual({ x: 15, y: 25 });
    });
  });

  describe('precision and numerical stability', () => {
    it('should handle very large coordinates', () => {
      const points = [
        { x: 1000000, y: 2000000 },
        { x: 1000100, y: 2000000 },
        { x: 1000100, y: 2000100 },
      ];

      const point = computeOrthogonalPointOnPath(points, 0.5);
      expect(point.x).toBeCloseTo(1000100, 1);
      expect(point.y).toBeCloseTo(2000000, 1);
    });

    it('should handle negative coordinates', () => {
      const points = [
        { x: -100, y: -50 },
        { x: 0, y: -50 },
        { x: 0, y: 50 },
      ];

      // Total length: 100 + 100 = 200
      // At 75% should be halfway up the vertical segment
      const point = computeOrthogonalPointOnPath(points, 0.75);
      expect(point).toEqual({ x: 0, y: 0 });
    });

    it('should handle mixed positive and negative coordinates', () => {
      const points = [
        { x: -50, y: -50 },
        { x: 50, y: -50 },
        { x: 50, y: 50 },
        { x: -50, y: 50 },
      ];

      // Total length: 100 + 100 + 100 = 300
      // At 12.5% = 37.5 units = 37.5 along first segment
      const point = computeOrthogonalPointOnPath(points, 0.125);
      expect(point.x).toBeCloseTo(-12.5, 1);
      expect(point.y).toBeCloseTo(-50, 1);
    });
  });

  describe('typical routing scenarios', () => {
    it('should handle output from actual orthogonal routing', () => {
      // Simulated output from getOrthogonalPathPoints
      const points = [
        { x: 10, y: 20 }, // Source
        { x: 30, y: 20 }, // First offset point
        { x: 30, y: 60 }, // Corner
        { x: 80, y: 60 }, // Corner
        { x: 80, y: 100 }, // Last offset point
        { x: 100, y: 100 }, // Target
      ];

      // Test various percentages
      const point25 = computeOrthogonalPointOnPath(points, 0.25);
      const point50 = computeOrthogonalPointOnPath(points, 0.5);
      const point75 = computeOrthogonalPointOnPath(points, 0.75);

      // Verify points are on the path
      expect(point25.x).toBeGreaterThanOrEqual(10);
      expect(point25.x).toBeLessThanOrEqual(100);
      expect(point50.y).toBeGreaterThanOrEqual(20);
      expect(point50.y).toBeLessThanOrEqual(100);
      expect(point75.x).toBeGreaterThanOrEqual(10);
      expect(point75.x).toBeLessThanOrEqual(100);
    });

    it('should maintain path continuity', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ];

      // Points should progress smoothly along the path
      const percentages = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
      let prevPoint = computeOrthogonalPointOnPath(points, 0);

      for (let i = 1; i < percentages.length; i++) {
        const point = computeOrthogonalPointOnPath(points, percentages[i]);

        // Each point should be different from the previous (path progresses)
        const distance = Math.hypot(point.x - prevPoint.x, point.y - prevPoint.y);
        expect(distance).toBeGreaterThan(0);

        prevPoint = point;
      }
    });
  });
});
