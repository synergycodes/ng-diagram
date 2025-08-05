import { describe, expect, it } from 'vitest';
import { Point } from '../../types/utils';
import { distanceBetweenPoints } from './distance-between-points';

describe('distanceBetweenPoints', () => {
  const testCases: {
    pointA: Point;
    pointB: Point;
    expected: number;
  }[] = [
    // Basic horizontal and vertical distances
    { pointA: { x: 0, y: 0 }, pointB: { x: 3, y: 0 }, expected: 3 },
    { pointA: { x: 0, y: 0 }, pointB: { x: -3, y: 0 }, expected: 3 },
    { pointA: { x: 0, y: 0 }, pointB: { x: 0, y: 4 }, expected: 4 },
    { pointA: { x: 0, y: 0 }, pointB: { x: 0, y: -4 }, expected: 4 },

    // Classic Pythagorean theorem cases
    { pointA: { x: 0, y: 0 }, pointB: { x: 3, y: 4 }, expected: 5 },
    { pointA: { x: 0, y: 0 }, pointB: { x: 5, y: 12 }, expected: 13 },
    { pointA: { x: 0, y: 0 }, pointB: { x: 8, y: 15 }, expected: 17 },

    // Same point (zero distance)
    { pointA: { x: 0, y: 0 }, pointB: { x: 0, y: 0 }, expected: 0 },
    { pointA: { x: 5, y: 10 }, pointB: { x: 5, y: 10 }, expected: 0 },
    { pointA: { x: -3, y: -7 }, pointB: { x: -3, y: -7 }, expected: 0 },

    // Diagonal distances (45-degree angles)
    { pointA: { x: 0, y: 0 }, pointB: { x: 1, y: 1 }, expected: Math.sqrt(2) },
    { pointA: { x: 0, y: 0 }, pointB: { x: 2, y: 2 }, expected: Math.sqrt(8) },
    { pointA: { x: 1, y: 1 }, pointB: { x: 3, y: 3 }, expected: Math.sqrt(8) },

    // Negative coordinates
    { pointA: { x: -2, y: -3 }, pointB: { x: 1, y: 1 }, expected: 5 },
    { pointA: { x: -5, y: -5 }, pointB: { x: -1, y: -2 }, expected: 5 },
    { pointA: { x: 2, y: 3 }, pointB: { x: -1, y: -1 }, expected: 5 },

    // Decimal coordinates
    { pointA: { x: 0.5, y: 0.5 }, pointB: { x: 1.5, y: 1.5 }, expected: Math.sqrt(2) },
    {
      pointA: { x: 1.2, y: 3.4 },
      pointB: { x: 5.6, y: 7.8 },
      expected: Math.sqrt((5.6 - 1.2) ** 2 + (7.8 - 3.4) ** 2),
    },

    // Large coordinates
    { pointA: { x: 1000, y: 2000 }, pointB: { x: 1300, y: 2400 }, expected: 500 },
    {
      pointA: { x: 0, y: 0 },
      pointB: { x: 1000000, y: 0 },
      expected: 1000000,
    },

    // Order independence (distance from A to B should equal B to A)
    { pointA: { x: 3, y: 4 }, pointB: { x: 0, y: 0 }, expected: 5 },
    { pointA: { x: 7, y: 1 }, pointB: { x: 4, y: 5 }, expected: 5 },

    // Special mathematical values
    { pointA: { x: 0, y: 0 }, pointB: { x: Math.sqrt(3), y: 1 }, expected: 2 },
  ];

  describe('distanceBetweenPoints', () => {
    it('should calculate correct distances for all test cases', () => {
      testCases.forEach(({ pointA, pointB, expected }) => {
        const result = distanceBetweenPoints(pointA, pointB);
        expect(result).toBeCloseTo(expected, 10); // Using toBeCloseTo for floating point precision
      });
    });
  });
});
