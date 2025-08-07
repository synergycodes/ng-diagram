import { describe, expect, it } from 'vitest';
import { calculateGradualForce } from './calculate-gradual-force';

describe('calculateGradualForce', () => {
  const maxForce = 15;
  const threshold = 50;

  it('should return maxForce when distance is 0 (at edge)', () => {
    const result = calculateGradualForce(0, maxForce, threshold);
    expect(result).toBe(maxForce);
  });

  it('should return 0 when distance equals threshold', () => {
    const result = calculateGradualForce(threshold, maxForce, threshold);
    expect(result).toBe(0);
  });

  it('should return 0 when distance exceeds threshold', () => {
    const result = calculateGradualForce(threshold + 10, maxForce, threshold);
    expect(result).toBe(0);
  });

  it('should interpolate linearly between 0 and maxForce', () => {
    // At 50% distance (25px from edge with 50px threshold)
    const halfDistance = threshold / 2;
    const result = calculateGradualForce(halfDistance, maxForce, threshold);
    expect(result).toBeCloseTo(maxForce * 0.5, 10);

    // At 20% distance (10px from edge with 50px threshold)
    const twentyPercentDistance = threshold * 0.2;
    const result20 = calculateGradualForce(twentyPercentDistance, maxForce, threshold);
    expect(result20).toBeCloseTo(maxForce * 0.8, 10); // 1 - 0.2 = 0.8

    // At 80% distance (40px from edge with 50px threshold)
    const eightyPercentDistance = threshold * 0.8;
    const result80 = calculateGradualForce(eightyPercentDistance, maxForce, threshold);
    expect(result80).toBeCloseTo(maxForce * 0.2, 10); // 1 - 0.8 = 0.2
  });

  it('should work with different maxForce values', () => {
    const customMaxForce = 30;
    const halfDistance = threshold / 2;
    const result = calculateGradualForce(halfDistance, customMaxForce, threshold);
    expect(result).toBeCloseTo(customMaxForce * 0.5, 10);
  });

  it('should work with different threshold values', () => {
    const customThreshold = 100;
    const halfDistance = customThreshold / 2;
    const result = calculateGradualForce(halfDistance, maxForce, customThreshold);
    expect(result).toBeCloseTo(maxForce * 0.5, 10);
  });

  it('should handle edge case of very small distances', () => {
    const verySmallDistance = 0.1;
    const result = calculateGradualForce(verySmallDistance, maxForce, threshold);
    const expectedRatio = 1 - verySmallDistance / threshold;
    expect(result).toBeCloseTo(maxForce * expectedRatio, 10);
  });
});
