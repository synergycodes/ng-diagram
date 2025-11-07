import { describe, expect, it } from 'vitest';
import { isValidPosition, isValidSize } from '../measurement-validation';

describe('isValidSize', () => {
  it('should return true for valid size with positive dimensions', () => {
    expect(isValidSize({ width: 100, height: 50 })).toBe(true);
  });

  it('should return true for size with small positive dimensions', () => {
    expect(isValidSize({ width: 0.1, height: 0.1 })).toBe(true);
  });

  it('should return false for size with zero width', () => {
    expect(isValidSize({ width: 0, height: 50 })).toBe(false);
  });

  it('should return false for size with zero height', () => {
    expect(isValidSize({ width: 100, height: 0 })).toBe(false);
  });

  it('should return false for size with both dimensions zero', () => {
    expect(isValidSize({ width: 0, height: 0 })).toBe(false);
  });

  it('should return false for size with negative width', () => {
    expect(isValidSize({ width: -10, height: 50 })).toBe(false);
  });

  it('should return false for size with negative height', () => {
    expect(isValidSize({ width: 100, height: -10 })).toBe(false);
  });

  it('should return false for size with both dimensions negative', () => {
    expect(isValidSize({ width: -10, height: -20 })).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidSize(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidSize(null)).toBe(false);
  });
});

describe('isValidPosition', () => {
  it('should return true for valid position with positive coordinates', () => {
    expect(isValidPosition({ x: 100, y: 50 })).toBe(true);
  });

  it('should return true for position at origin', () => {
    expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
  });

  it('should return true for position with zero x', () => {
    expect(isValidPosition({ x: 0, y: 50 })).toBe(true);
  });

  it('should return true for position with zero y', () => {
    expect(isValidPosition({ x: 100, y: 0 })).toBe(true);
  });

  it('should return true for position with negative coordinates', () => {
    expect(isValidPosition({ x: -10, y: -20 })).toBe(true);
  });

  it('should return true for position with mixed sign coordinates', () => {
    expect(isValidPosition({ x: -10, y: 20 })).toBe(true);
    expect(isValidPosition({ x: 10, y: -20 })).toBe(true);
  });

  it('should return false for position with null x', () => {
    expect(isValidPosition({ x: null as unknown as number, y: 50 })).toBe(false);
  });

  it('should return false for position with null y', () => {
    expect(isValidPosition({ x: 100, y: null as unknown as number })).toBe(false);
  });

  it('should return false for position with both coordinates null', () => {
    expect(isValidPosition({ x: null as unknown as number, y: null as unknown as number })).toBe(false);
  });

  it('should return false for position with undefined x', () => {
    expect(isValidPosition({ x: undefined as unknown as number, y: 50 })).toBe(false);
  });

  it('should return false for position with undefined y', () => {
    expect(isValidPosition({ x: 100, y: undefined as unknown as number })).toBe(false);
  });

  it('should return false for position with both coordinates undefined', () => {
    expect(isValidPosition({ x: undefined as unknown as number, y: undefined as unknown as number })).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isValidPosition(undefined)).toBe(false);
  });

  it('should return false for null', () => {
    expect(isValidPosition(null)).toBe(false);
  });

  it('should return false for position with NaN x', () => {
    expect(isValidPosition({ x: NaN, y: 50 })).toBe(false);
  });

  it('should return false for position with NaN y', () => {
    expect(isValidPosition({ x: 100, y: NaN })).toBe(false);
  });

  it('should return false for position with both coordinates NaN', () => {
    expect(isValidPosition({ x: NaN, y: NaN })).toBe(false);
  });
});
