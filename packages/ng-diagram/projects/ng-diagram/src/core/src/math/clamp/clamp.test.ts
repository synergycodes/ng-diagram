import { describe, expect, it } from 'vitest';
import { clamp } from './clamp';

describe('clamp', () => {
  const testCases = [
    // Basic cases - value within range
    { min: 0, value: 5, max: 10, expected: 5 },
    { min: -5, value: 0, max: 5, expected: 0 },
    { min: 1, value: 3, max: 7, expected: 3 },

    // Value below minimum
    { min: 0, value: -5, max: 10, expected: 0 },
    { min: 5, value: 2, max: 15, expected: 5 },
    { min: -10, value: -20, max: 0, expected: -10 },

    // Value above maximum
    { min: 0, value: 15, max: 10, expected: 10 },
    { min: -5, value: 10, max: 5, expected: 5 },
    { min: -20, value: -5, max: -10, expected: -10 },

    // Edge cases - value equals boundaries
    { min: 5, value: 5, max: 10, expected: 5 },
    { min: 0, value: 10, max: 10, expected: 10 },
    { min: 7, value: 7, max: 7, expected: 7 },

    // Decimal values
    { min: 0.1, value: 0.5, max: 0.9, expected: 0.5 },
    { min: 1.5, value: 1.2, max: 2.8, expected: 1.5 },
    { min: 0.1, value: 3.7, max: 2.5, expected: 2.5 },

    // Large numbers
    { min: 1000, value: 1500, max: 2000, expected: 1500 },
    { min: 1000000, value: 500000, max: 2000000, expected: 1000000 },

    // Zero boundaries
    { min: 0, value: 5, max: 0, expected: 0 },
    { min: 0, value: -5, max: 0, expected: 0 },

    // Negative ranges
    { min: -10, value: -5, max: -2, expected: -5 },
    { min: -10, value: -15, max: -2, expected: -10 },
    { min: -10, value: 0, max: -2, expected: -2 },
  ];

  // Additional specific test groups for edge cases
  describe('clamp', () => {
    it('it should ensure the value stays within the boundaries', () => {
      testCases.forEach(({ min, value, max, expected }) => {
        const result = clamp({ min, value, max });
        expect(result).toBe(expected);
      });
    });
  });
});
