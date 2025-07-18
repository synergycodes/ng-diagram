import { describe, expect, it } from 'vitest';
import { snapAngle } from '../snap-angle';

describe('snapAngle', () => {
  it('should snap to nearest step', () => {
    expect(snapAngle(13, 5)).toBe(15);
    expect(snapAngle(12, 5)).toBe(10);
    expect(snapAngle(-13, 5)).toBe(-15 + 360);
  });

  it('should snap to 0 if angle is too small and step > 1', () => {
    expect(snapAngle(0.4, 5)).toBe(0);
    expect(snapAngle(-0.4, 5)).toBe(0);
  });

  it('should handle right angle special case for step 1', () => {
    expect(snapAngle(89.2, 1)).toBe(90);
    expect(snapAngle(90.9, 1)).toBe(90);
    expect(snapAngle(88.2, 1)).toBe(88);
    expect(snapAngle(88.7, 1)).toBe(90);
  });

  it('should return normalized angle', () => {
    expect(snapAngle(370, 10)).toBe(10);
    expect(snapAngle(-10, 10)).toBe(350);
  });
});
