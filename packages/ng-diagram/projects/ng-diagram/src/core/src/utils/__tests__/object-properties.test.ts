import { describe, expect, it } from 'vitest';
import { hasChangedProperties, isSameValue, omitProperties } from '../object-properties';

describe('omitProperties', () => {
  it('should return a copy without the excluded properties', () => {
    const source = { a: 1, b: 2, c: 3 };

    expect(omitProperties(source, ['b'])).toEqual({ a: 1, c: 3 });
  });

  it('should not mutate the source object', () => {
    const source = { a: 1, b: 2 };

    omitProperties(source, ['a']);

    expect(source).toEqual({ a: 1, b: 2 });
  });

  it('should ignore excluded properties that are not present', () => {
    const source: { a: number; b?: number } = { a: 1 };

    expect(omitProperties(source, ['b'])).toEqual({ a: 1 });
  });
});

describe('isSameValue', () => {
  it('should compare primitives with Object.is semantics', () => {
    expect(isSameValue('left', 'left')).toBe(true);
    expect(isSameValue('left', 'right')).toBe(false);
    expect(isSameValue(0.5, 0.5)).toBe(true);
    expect(isSameValue(NaN, NaN)).toBe(true);
    expect(isSameValue(undefined, undefined)).toBe(true);
    expect(isSameValue(null, undefined)).toBe(false);
  });

  it('should compare objects shallowly by their entries', () => {
    expect(isSameValue({ width: 10, height: 20 }, { width: 10, height: 20 })).toBe(true);
    expect(isSameValue({ width: 10, height: 20 }, { width: 10, height: 21 })).toBe(false);
    expect(isSameValue({ x: 1 }, { x: 1, y: 2 })).toBe(false);
  });

  it('should not treat an object and a primitive as equal', () => {
    expect(isSameValue({ x: 1 }, 1)).toBe(false);
    expect(isSameValue(null, { x: 1 })).toBe(false);
  });
});

describe('hasChangedProperties', () => {
  const current = { side: 'left', type: 'source', size: { width: 10, height: 10 } };

  it('should return false when all changed properties match the current values', () => {
    expect(hasChangedProperties(current, { side: 'left', size: { width: 10, height: 10 } })).toBe(false);
  });

  it('should return true when any property differs', () => {
    expect(hasChangedProperties(current, { side: 'right' })).toBe(true);
    expect(hasChangedProperties(current, { size: { width: 5, height: 10 } })).toBe(true);
  });

  it('should ignore properties set to undefined', () => {
    expect(hasChangedProperties(current, { side: undefined })).toBe(false);
  });

  it('should return false for an empty change set', () => {
    expect(hasChangedProperties(current, {})).toBe(false);
  });
});
