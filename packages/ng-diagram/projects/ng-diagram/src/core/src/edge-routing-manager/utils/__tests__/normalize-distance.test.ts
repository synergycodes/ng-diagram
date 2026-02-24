import { describe, expect, it } from 'vitest';
import { normalizeDistance } from '../normalize-distance';

describe('normalizeDistance', () => {
  const totalLength = 200;

  describe('positive distance', () => {
    it('should return the distance as-is when within range', () => {
      expect(normalizeDistance(50, totalLength)).toBe(50);
    });

    it('should return 0 for distance 0', () => {
      expect(normalizeDistance(0, totalLength)).toBe(0);
    });

    it('should return totalLength for distance equal to totalLength', () => {
      expect(normalizeDistance(200, totalLength)).toBe(200);
    });

    it('should clamp to totalLength when distance exceeds it', () => {
      expect(normalizeDistance(500, totalLength)).toBe(200);
    });
  });

  describe('negative distance (from end)', () => {
    it('should resolve negative distance from the end', () => {
      expect(normalizeDistance(-30, totalLength)).toBe(170);
    });

    it('should clamp to 0 when negative distance exceeds totalLength', () => {
      expect(normalizeDistance(-500, totalLength)).toBe(0);
    });

    it('should treat -0 as end of path', () => {
      expect(normalizeDistance(-0, totalLength)).toBe(200);
    });
  });

  describe('zero totalLength', () => {
    it('should return 0 for any positive distance', () => {
      expect(normalizeDistance(50, 0)).toBe(0);
    });

    it('should return 0 for any negative distance', () => {
      expect(normalizeDistance(-50, 0)).toBe(0);
    });

    it('should return 0 for distance 0', () => {
      expect(normalizeDistance(0, 0)).toBe(0);
    });
  });
});
