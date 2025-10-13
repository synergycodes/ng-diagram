import type { InputModifiers } from '../input-events/input-events.interface';
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
  /** Whether code is executing in a Server-Side Rendering context (no Window/DOM) */
  isSSR?: boolean;
  /** Platform identity for high-level adapter routing */
  runtime?: LooseAutocomplete<'web' | 'node' | 'other'>;
  /** Primary modifier key semantics for shortcuts (meta on Mac, ctrl elsewhere) */

  /**
   * Input helpers. Web implementation accepts native DOM events; other platforms
   * can provide compatible adapters without leaking their native event types into core.
   */
  eventHelpers: {
    getModifiers: (event: unknown) => InputModifiers;
    withPrimaryModifier: (event: unknown) => boolean;
    withSecondaryModifier: (event: unknown) => boolean;
    withShiftModifier: (event: unknown) => boolean;
    withMetaModifier: (event: unknown) => boolean;
    withoutModifiers: (event: unknown) => boolean;
    withPrimaryButton: (event: unknown) => boolean;
    isArrowKeyPressed: (event: unknown) => boolean;
    isDeleteKeyPressed: (event: unknown) => boolean;
    isKeyPressed: (key: string) => (event: unknown) => boolean;
    isKeyComboPressed: (key: string, ...mods: (keyof InputModifiers)[]) => (event: unknown) => boolean;
  };
  now: () => number;
  generateId: () => string;
}
