import type { InputModifiers } from '../input-events/input-events.interface';
import { DEFAULT_SHORTCUTS } from '../shortcut-manager';
import type { ActionName } from './action.interface';

/**
 * Normalized keyboard input for shortcut matching
 * Contains the key and already-normalized modifiers
 */
export interface NormalizedKeyboardInput {
  key: string;
  modifiers: InputModifiers;
}

/**
 * Defines a keyboard shortcut binding
 */
export interface ShortcutBinding {
  /**
   * Key value (e.g., 'c', 'Delete', 'ArrowUp')
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values - Complete list of valid key values
   */
  key: string;
  /** Required modifier keys (all are optional - omitted means no modifiers required) */
  modifiers?: Partial<InputModifiers>;
}

/**
 * Shortcut definition for registering keyboard shortcuts
 *
 * Minimal configuration required - only id, actionName, and bindings are mandatory.
 * Defaults:
 * - enabled: true
 */
export interface ShortcutDefinition {
  /** Action name that will be mapped to input event via ActionMapper */
  actionName: ActionName;
  /** Platform-specific key bindings */
  bindings: ShortcutBinding[];
  /** Can be disabled at runtime. Default: true */
  enabled?: boolean;
}

export type DefaultShortcutDefinitions = typeof DEFAULT_SHORTCUTS;
