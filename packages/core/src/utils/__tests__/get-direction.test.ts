import { describe, expect, it } from 'vitest';
import { getSign, isAngleHorizontal, isAngleVertical } from '../get-direction';

describe('isAngleVertical', () => {
  it('should return true for 90', () => {
    expect(isAngleVertical(90)).toBe(true);
  });
  it('should return true for 270', () => {
    expect(isAngleVertical(270)).toBe(true);
  });
  it('should return false for 0', () => {
    expect(isAngleVertical(0)).toBe(false);
  });
  it('should return false for 180', () => {
    expect(isAngleVertical(180)).toBe(false);
  });
});

describe('isAngleHorizontal', () => {
  it('should return true for 0', () => {
    expect(isAngleHorizontal(0)).toBe(true);
  });
  it('should return true for 180', () => {
    expect(isAngleHorizontal(180)).toBe(true);
  });
  it('should return false for 90', () => {
    expect(isAngleHorizontal(90)).toBe(false);
  });
  it('should return false for 270', () => {
    expect(isAngleHorizontal(270)).toBe(false);
  });
});

describe('getSign', () => {
  it('should return 1 for 0', () => {
    expect(getSign(0)).toBe(1);
  });
  it('should return 1 for 90', () => {
    expect(getSign(90)).toBe(1);
  });
  it('should return -1 for 180', () => {
    expect(getSign(180)).toBe(-1);
  });
  it('should return -1 for 270', () => {
    expect(getSign(270)).toBe(-1);
  });
});
