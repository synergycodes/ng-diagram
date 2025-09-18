import { DeepPartial } from '../types';

/**
 * Deep merges a partial configuration with a default configuration
 */
export function deepMerge<T>(original: T, override: DeepPartial<T>): T {
  const result = { ...original };

  for (const key in override) {
    if (Object.hasOwn(override, key)) {
      const value = override[key];
      const defaultValue = original[key as keyof T];

      if (value !== undefined) {
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          typeof value !== 'function' &&
          typeof defaultValue === 'object' &&
          defaultValue !== null &&
          !Array.isArray(defaultValue) &&
          typeof defaultValue !== 'function'
        ) {
          (result as Record<string, unknown>)[key] = deepMerge(
            defaultValue as Record<string, unknown>,
            value as DeepPartial<Record<string, unknown>>
          );
        } else {
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  return result;
}
