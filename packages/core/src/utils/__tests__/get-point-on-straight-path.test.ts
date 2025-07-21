import { describe, expect, it } from 'vitest';
import { getPointOnStraightPath } from '../get-point-on-path/get-point-on-straight-path';

describe('getPointOnStraightPath', () => {
  it('should return the midpoint of a straight path at 50%', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should return the start point at 0%', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 10, y: 20 },
        { x: 110, y: 120 },
      ],
      percentage: 0,
    });
    expect(point).toEqual({ x: 10, y: 20 });
  });

  it('should return the end point at 100%', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 10, y: 20 },
        { x: 110, y: 120 },
      ],
      percentage: 1,
    });
    expect(point).toEqual({ x: 110, y: 120 });
  });

  it('should return 25% along the path', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
      ],
      percentage: 0.25,
    });
    expect(point).toEqual({ x: 25, y: 50 });
  });

  it('should return 75% along the path', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 200 },
      ],
      percentage: 0.75,
    });
    expect(point).toEqual({ x: 75, y: 150 });
  });

  it('should handle horizontal lines', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 50 },
        { x: 100, y: 50 },
      ],
      percentage: 0.3,
    });
    expect(point).toEqual({ x: 30, y: 50 });
  });

  it('should handle vertical lines', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
      ],
      percentage: 0.7,
    });
    expect(point).toEqual({ x: 50, y: 70 });
  });

  it('should handle negative coordinates', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: -50, y: -50 },
        { x: 50, y: 50 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should handle percentage less than 0 (extrapolation backwards)', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: -0.5,
    });
    expect(point).toEqual({ x: -50, y: -50 });
  });

  it('should handle percentage greater than 1 (extrapolation forwards)', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 1.5,
    });
    expect(point).toEqual({ x: 150, y: 150 });
  });

  it('should handle identical start and end points', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 50, y: 50 },
        { x: 50, y: 50 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should handle decimal coordinates', () => {
    const point = getPointOnStraightPath({
      points: [
        { x: 1.5, y: 2.5 },
        { x: 3.5, y: 4.5 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 2.5, y: 3.5 });
  });
});
