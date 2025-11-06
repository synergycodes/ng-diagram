import type { LooseAutocomplete } from './utils';

/**
 * Interface representing environment information
 *
 * @category Types/Middleware
 */
export interface EnvironmentInfo {
  /** User Operating system name */
  os: LooseAutocomplete<'MacOS' | 'Windows' | 'Linux' | 'iOS' | 'Android' | 'Unknown'> | null;
  /** User Browser name (when applicable) */
  browser: LooseAutocomplete<'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'IE' | 'Other'> | null;
  /** Platform identity for high-level adapter routing */
  runtime: LooseAutocomplete<'web' | 'node' | 'other'> | null;
  /** Current timestamp in ms */
  now: () => number;
  /** Generates a unique ID */
  generateId: () => string;
}
