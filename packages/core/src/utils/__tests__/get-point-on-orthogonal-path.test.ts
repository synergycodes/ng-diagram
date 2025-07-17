import { describe, expect, it } from 'vitest';
import { getPointOnOrthogonalPath } from '../get-point-on-path/get-point-on-orthogonal-path';
import { getPointOnPath } from '../get-point-on-path/get-point-on-path';

describe('getPointOnOrthogonalPath', () => {
  it('should return the point on the straight path', () => {
    const point = getPointOnOrthogonalPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 50, y: 50 });
  });

  it('should return x: 0 y: 0 if the path is empty', () => {
    const point = getPointOnOrthogonalPath({
      points: [],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return x: 0 y: 0 if the path has only one point', () => {
    const point = getPointOnPath({
      points: [{ x: 42, y: 24 }],
      percentage: 0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the beginning of the path if the percentage is less than 0', () => {
    const point = getPointOnOrthogonalPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: -0.5,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return the beginning of the path if the percentage is exactly 0', () => {
    const point = getPointOnPath({
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      percentage: 0,
    });
    expect(point).toEqual({ x: 10, y: 20 });
  });

  it('should return the end of the path if the percentage is greater than 1', () => {
    const point = getPointOnOrthogonalPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 1.5,
    });
    expect(point).toEqual({ x: 100, y: 100 });
  });

  it('should return the end of the path if the percentage is exactly 1', () => {
    const point = getPointOnPath({
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      percentage: 1,
    });
    expect(point).toEqual({ x: 30, y: 40 });
  });

  it('should return x: 0 y: 0 if the percentage is negative and path has only one point', () => {
    const point = getPointOnPath({
      points: [{ x: 42, y: 24 }],
      percentage: -1,
    });
    expect(point).toEqual({ x: 0, y: 0 });
  });

  it('should return proper point if path has more than 2 points', () => {
    const point = getPointOnOrthogonalPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      percentage: 0.25,
    });
    expect(point).toEqual({ x: 75, y: 0 });
  });

  it('should return the point on the second segment for percentage beyond the first segment', () => {
    const point = getPointOnPath({
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      percentage: 0.75,
    });
    expect(point).toEqual({ x: 100, y: 50 });
  });

  it('should return the last point if percentage is NaN', () => {
    const points = [
      { x: 5, y: 5 },
      { x: 15, y: 20 },
      { x: 25, y: 25 },
    ];
    const point = getPointOnPath({
      points,
      percentage: NaN,
    });
    expect(point).toEqual({ x: 25, y: 25 });
  });
});
