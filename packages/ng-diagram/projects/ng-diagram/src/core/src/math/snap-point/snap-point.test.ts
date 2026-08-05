import { describe, expect, it } from 'vitest';
import { snapPoint } from './snap-point';

describe('snapPoint', () => {
  it('snaps each axis to its step', () => {
    expect(snapPoint({ x: 12, y: 16 }, { width: 10, height: 10 })).toEqual({ x: 10, y: 20 });
  });

  it('defaults the offset to zero', () => {
    expect(snapPoint({ x: 12, y: 16 }, { width: 10, height: 10 })).toEqual(
      snapPoint({ x: 12, y: 16 }, { width: 10, height: 10 }, { width: 0, height: 0 })
    );
  });

  it('applies a per-axis offset', () => {
    expect(snapPoint({ x: 90, y: 90 }, { width: 50, height: 50 }, { width: 0, height: 60 })).toEqual({
      x: 100,
      y: 110,
    });
  });
});
