import { describe, expect, it } from 'vitest';
import { add } from './index';

describe('add function', () => {
  it('should add two positive numbers correctly', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('should add negative numbers correctly', () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it('should add zero correctly', () => {
    expect(add(0, 5)).toBe(5);
    expect(add(5, 0)).toBe(5);
  });
});
