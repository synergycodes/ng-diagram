import type { LooseAutocomplete } from './utils';

/**
 * Interface representing environment information
 *
 * @category Types
 */
export interface EnvironmentInfo {
  /** User Operating system name */
  os: LooseAutocomplete<'MacOS' | 'Windows' | 'Linux' | 'iOS' | 'Android' | 'Unknown'> | null;
  /** User Browser name (when applicable) */
  browser: LooseAutocomplete<'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'IE' | 'Other'> | null;
  /** Platform identity for high-level adapter routing */
  runtime?: LooseAutocomplete<'web' | 'node' | 'other'>;
  /** Primary modifier key semantics for shortcuts (meta on Mac, ctrl elsewhere) */

  now: () => number;
  generateId: () => string;
}
