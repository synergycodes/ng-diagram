import { describe, expect, it } from 'vitest';
import { snapNumber } from './snap-number';

describe('snapNumber', () => {
  it('snaps to the nearest multiple of step', () => {
    expect(snapNumber(12, 10)).toBe(10);
    expect(snapNumber(16, 10)).toBe(20);
    expect(snapNumber(25, 10)).toBe(30); // .5 rounds up
  });

  it('returns the value unchanged when step is 0', () => {
    expect(snapNumber(37, 0)).toBe(37);
  });

  it('ignores the offset when step is 0', () => {
    expect(snapNumber(37, 0, 60)).toBe(37);
  });

  it('defaults offset to 0', () => {
    expect(snapNumber(16, 10)).toBe(snapNumber(16, 10, 0));
  });

  it('snaps to the sequence offset + n * step', () => {
    // header/min height of 60, snapping every 50 -> 60, 110, 160, ...
    expect(snapNumber(60, 50, 60)).toBe(60);
    expect(snapNumber(80, 50, 60)).toBe(60); // closer to 60 than 110
    expect(snapNumber(90, 50, 60)).toBe(110); // closer to 110
    expect(snapNumber(110, 50, 60)).toBe(110);
    expect(snapNumber(140, 50, 60)).toBe(160);
  });

  it('supports negative offsets', () => {
    // grid is ..., -5, 5, 15, ...
    expect(snapNumber(-3, 10, -5)).toBe(-5);
    expect(snapNumber(4, 10, -5)).toBe(5);
  });
});
