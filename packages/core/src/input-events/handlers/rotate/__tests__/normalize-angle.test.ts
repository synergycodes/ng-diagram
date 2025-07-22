import { describe, expect, it } from 'vitest';
import { normalizeAngle } from '../normalize-angle';

describe('normalizeAngle', () => {
  it('should normalize positive angles', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(90)).toBe(90);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
  });

  it('should normalize negative angles', () => {
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-360)).toBe(0);
    expect(normalizeAngle(-450)).toBe(270);
  });
});
