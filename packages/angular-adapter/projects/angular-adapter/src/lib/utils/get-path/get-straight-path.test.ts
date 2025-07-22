import { describe, expect, it } from 'vitest';
import { getStraightPath } from './get-straight-path';

describe('getStraightPath', () => {
  it('should return empty string if no points are provided', () => {
    const paths = getStraightPath([]);
    expect(paths).toBe('');
  });

  it('should return path from points', () => {
    const paths = getStraightPath([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(paths).toBe('M 0 0 L 100 100');
  });
});
