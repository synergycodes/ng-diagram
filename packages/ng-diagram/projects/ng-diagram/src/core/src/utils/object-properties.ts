/**
 * Returns a shallow copy of `source` without the `excluded` properties.
 *
 * @internal
 */
export const omitProperties = <T extends object>(source: T, excluded: readonly (keyof T)[]): Partial<T> => {
  const result: Partial<T> = { ...source };
  for (const key of excluded) {
    delete result[key];
  }
  return result;
};

/**
 * Compares two property values; object values (e.g. size, position) are
 * compared shallowly by their own enumerable entries, everything else with
 * Object.is.
 *
 * @internal
 */
export const isSameValue = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const aEntries = Object.entries(a);
  return (
    aEntries.length === Object.keys(b).length &&
    aEntries.every(([key, value]) => Object.is(value, (b as Record<string, unknown>)[key]))
  );
};

/**
 * Checks whether any defined property in `changes` differs from `current`.
 * Properties set to `undefined` are treated as "not part of the update".
 *
 * @internal
 */
export const hasChangedProperties = <T extends object>(current: T, changes: Partial<T>): boolean =>
  (Object.keys(changes) as (keyof T)[]).some(
    (key) => changes[key] !== undefined && !isSameValue(current[key], changes[key])
  );
