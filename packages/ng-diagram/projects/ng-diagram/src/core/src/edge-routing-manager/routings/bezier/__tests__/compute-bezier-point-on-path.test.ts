import { describe, expect, it } from 'vitest';
import { computeBezierPointOnPath } from '../compute-bezier-point-on-path';

describe('computeBezierPointOnPath', () => {
  it('should return the start point at 0%', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      0
    );
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the end point at 100%', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      1
    );
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should return a point on the curve at 50%', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ],
      0.5
    );
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should handle percentage less than 0 by clamping to 0', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      -0.5
    );
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should handle percentage greater than 1 by clamping to 1', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      1.5
    );
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should handle straight line when control points are aligned', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 33.33, y: 33.33 },
        { x: 66.67, y: 66.67 },
        { x: 100, y: 100 },
      ],
      0.5
    );
    expect(point.x).toBeCloseTo(50, 1);
    expect(point.y).toBeCloseTo(50, 1);
  });

  it('should handle complex curve with different control points', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      0.25
    );
    // At t=0.25, this should be somewhere in the curve
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(100);
    expect(point.y).toBeGreaterThan(0);
    expect(point.y).toBeLessThan(100);
  });

  it('should use linear interpolation for 2 points', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      0.5
    );
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should use quadratic bezier curve for 3 points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 50, y: 100 },
      { x: 100, y: 0 },
    ];

    // At t=0, should be at start
    expect(computeBezierPointOnPath(points, 0)).toEqual({ x: 0, y: 0 });

    // At t=1, should be at end
    expect(computeBezierPointOnPath(points, 1)).toEqual({ x: 100, y: 0 });

    // At t=0.5, should be at the peak of the parabola
    const midPoint = computeBezierPointOnPath(points, 0.5);
    expect(midPoint.x).toBeCloseTo(50, 1);
    expect(midPoint.y).toBeCloseTo(50, 1); // Halfway up the control point

    // At t=0.25
    // For quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
    // B(0.25) = 0.5625 * (0,0) + 0.375 * (50,100) + 0.0625 * (100,0)
    // x = 0 + 18.75 + 6.25 = 25
    // y = 0 + 37.5 + 0 = 37.5
    const quarterPoint = computeBezierPointOnPath(points, 0.25);
    expect(quarterPoint.x).toBeCloseTo(25, 1);
    expect(quarterPoint.y).toBeCloseTo(37.5, 1);
  });

  it('should return the single point when only 1 point is provided', () => {
    const point = computeBezierPointOnPath([{ x: 50, y: 50 }], 0.5);
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should return (0, 0) when no points are provided', () => {
    const point = computeBezierPointOnPath([], 0.5);
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should handle negative coordinates', () => {
    const point = computeBezierPointOnPath(
      [
        { x: -100, y: -100 },
        { x: -50, y: -50 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ],
      0.5
    );
    expect(point.x).toBeCloseTo(0, 1);
    expect(point.y).toBeCloseTo(0, 1);
  });

  it('should handle decimal coordinates', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 1.5, y: 2.5 },
        { x: 3.5, y: 4.5 },
        { x: 5.5, y: 6.5 },
        { x: 7.5, y: 8.5 },
      ],
      0.5
    );
    expect(point.x).toBeCloseTo(4.5, 1);
    expect(point.y).toBeCloseTo(5.5, 1);
  });

  it('should handle identical control points', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ],
      0.5
    );
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should calculate correct point at 25% on a standard curve', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
      ],
      0.25
    );
    // At t=0.25, this creates a specific curve shape
    expect(point.x).toBeCloseTo(15.625, 1);
    expect(point.y).toBeCloseTo(56.25, 1);
  });

  it('should calculate correct point at 75% on a standard curve', () => {
    const point = computeBezierPointOnPath(
      [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
      ],
      0.75
    );
    // At t=0.75, this creates a specific curve shape
    expect(point.x).toBeCloseTo(84.375, 1);
    expect(point.y).toBeCloseTo(56.25, 1);
  });
});
