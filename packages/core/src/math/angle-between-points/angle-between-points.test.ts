import { describe, expect, it } from 'vitest';
import { angleBetweenPoints } from './angle-between-points';

describe('angleBetweenPoints', () => {
  it('should calculate angle to the right (0 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 0 };
    expect(angleBetweenPoints(from, to)).toBe(0);
  });

  it('should calculate angle upward (-90 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 0, y: -10 };
    expect(angleBetweenPoints(from, to)).toBe(-90);
  });

  it('should calculate angle downward (90 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 0, y: 10 };
    expect(angleBetweenPoints(from, to)).toBe(90);
  });

  it('should calculate angle to the left (180 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: -10, y: 0 };
    expect(angleBetweenPoints(from, to)).toBe(180);
  });

  it('should calculate angle for diagonal points (45 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: 10, y: 10 };
    expect(angleBetweenPoints(from, to)).toBe(45);
  });

  it('should calculate angle for diagonal points (-135 degrees)', () => {
    const from = { x: 0, y: 0 };
    const to = { x: -10, y: -10 };
    expect(angleBetweenPoints(from, to)).toBe(-135);
  });

  it('should work with non-zero origin points', () => {
    const from = { x: 100, y: 100 };
    const to = { x: 110, y: 100 };
    expect(angleBetweenPoints(from, to)).toBe(0);
  });
});
