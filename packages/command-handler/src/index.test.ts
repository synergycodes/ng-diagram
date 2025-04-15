import { describe, expect, it } from 'vitest';
import { subtract } from './index';

describe('subtract function', () => {
  it('should subtract two positive numbers correctly', () => {
    expect(subtract(1, 2)).toBe(-1);
  });

  it('should subtract negative numbers correctly', () => {
    expect(subtract(-1, -2)).toBe(1);
  });

  it('should subtract zero correctly', () => {
    expect(subtract(0, 5)).toBe(-5);
    expect(subtract(5, 0)).toBe(5);
  });
});
