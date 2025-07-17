import { describe, expect, it } from 'vitest';
import { getPointOnBezierPath } from '../get-point-on-path/get-point-on-bezier-path';

describe('getPointOnBezierPath', () => {
  it('should return the start point at 0%', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      percentage: 0,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the end point at 100%', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      percentage: 1,
    });
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should return a point on the curve at 50%', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should handle percentage less than 0 by clamping to 0', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      percentage: -0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should handle percentage greater than 1 by clamping to 1', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 75, y: 100 },
        { x: 100, y: 100 },
      ],
      percentage: 1.5,
    });
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should handle straight line when control points are aligned', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 33.33, y: 33.33 },
        { x: 66.67, y: 66.67 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point.x).toBeCloseTo(50, 1);
    expect(point.y).toBeCloseTo(50, 1);
  });

  it('should handle complex curve with different control points', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 0, y: 0 },
        { x: 100, y: 0 },
      ],
      percentage: 0.25,
    });
    // At t=0.25, this should be somewhere in the curve
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(100);
    expect(point.y).toBeGreaterThan(0);
    expect(point.y).toBeLessThan(100);
  });

  it('should fall back to linear interpolation when less than 4 points', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should return (0, 0) when less than 2 points', () => {
    const point = getPointOnBezierPath({
      points: [{ x: 50, y: 50 }],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return (0, 0) when no points are provided', () => {
    const point = getPointOnBezierPath({
      points: [],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should handle negative coordinates', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: -100, y: -100 },
        { x: -50, y: -50 },
        { x: 50, y: 50 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point.x).toBeCloseTo(0, 1);
    expect(point.y).toBeCloseTo(0, 1);
  });

  it('should handle decimal coordinates', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 1.5, y: 2.5 },
        { x: 3.5, y: 4.5 },
        { x: 5.5, y: 6.5 },
        { x: 7.5, y: 8.5 },
      ],
      percentage: 0.5,
    });
    expect(point.x).toBeCloseTo(4.5, 1);
    expect(point.y).toBeCloseTo(5.5, 1);
  });

  it('should handle identical control points', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should calculate correct point at 25% on a standard curve', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
      ],
      percentage: 0.25,
    });
    // At t=0.25, this creates a specific curve shape
    expect(point.x).toBeCloseTo(15.625, 1);
    expect(point.y).toBeCloseTo(56.25, 1);
  });

  it('should calculate correct point at 75% on a standard curve', () => {
    const point = getPointOnBezierPath({
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 100 },
        { x: 100, y: 100 },
        { x: 100, y: 0 },
      ],
      percentage: 0.75,
    });
    // At t=0.75, this creates a specific curve shape
    expect(point.x).toBeCloseTo(84.375, 1);
    expect(point.y).toBeCloseTo(56.25, 1);
  });
});
