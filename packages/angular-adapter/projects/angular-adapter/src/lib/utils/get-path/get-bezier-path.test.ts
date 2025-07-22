import { describe, expect, it } from 'vitest';
import { getBezierPath } from './get-bezier-path';

describe('getBezierPath', () => {
  it('should return empty string if no points are provided', () => {
    const paths = getBezierPath([]);
    expect(paths).toBe('');
  });

  it('should return path from points', () => {
    const paths = getBezierPath([
      { x: 0, y: 0 },
      { x: 100, y: 100 },
    ]);
    expect(paths).toBe('M 0 0 L 100 100');
  });
});
