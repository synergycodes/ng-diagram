import { describe, expect, it } from 'vitest';
import { Point } from '../../types/utils';
import { subtractPoints } from './subtract-points';

describe('subtractPoints', () => {
  const testCases: {
    a: Point;
    b: Point;
    expected: Point;
  }[] = [
    // Basic axis-aligned differences
    { a: { x: 3, y: 0 }, b: { x: 0, y: 0 }, expected: { x: 3, y: 0 } },
    { a: { x: 0, y: 4 }, b: { x: 0, y: 0 }, expected: { x: 0, y: 4 } },

    // Mixed signs
    { a: { x: 10, y: 5 }, b: { x: 4, y: 7 }, expected: { x: 6, y: -2 } },
    { a: { x: -2, y: -3 }, b: { x: 1, y: 1 }, expected: { x: -3, y: -4 } },

    // Identical points (zero vector)
    { a: { x: 5, y: 10 }, b: { x: 5, y: 10 }, expected: { x: 0, y: 0 } },

    // Decimal coordinates
    { a: { x: 1.5, y: 0.5 }, b: { x: 0.5, y: 1.5 }, expected: { x: 1, y: -1 } },
  ];

  it('should return the vector difference a - b for all test cases', () => {
    testCases.forEach(({ a, b, expected }) => {
      expect(subtractPoints(a, b)).toEqual(expected);
    });
  });

  it('should be anti-symmetric: subtractPoints(b, a) negates subtractPoints(a, b)', () => {
    const a = { x: 7, y: 1 };
    const b = { x: 4, y: 5 };
    const ab = subtractPoints(a, b);
    const ba = subtractPoints(b, a);
    expect(ba).toEqual({ x: -ab.x, y: -ab.y });
  });
});
