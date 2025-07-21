import { describe, expect, it } from 'vitest';
import { getDistanceBetweenPoints } from '../get-distance-between-points';

describe('getDistanceBetweenPoints', () => {
  it('should return 0 for identical points', () => {
    expect(getDistanceBetweenPoints({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
  });

  it('should return euclidean distance for points on x axis', () => {
    expect(getDistanceBetweenPoints({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
  });

  it('should return euclidean distance for points on y axis', () => {
    expect(getDistanceBetweenPoints({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
  });

  it('should return euclidean distance for points in both axes', () => {
    expect(getDistanceBetweenPoints({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('should return euclidean distance for negative coordinates', () => {
    expect(getDistanceBetweenPoints({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
  });
});
