import type { InputModifiers } from '../input-events/input-events.interface';
import type { KeyboardActionName, PointerOnlyActionName, WheelOnlyActionName } from './shortcut-action.interface';

/**
 * Normalized keyboard input for shortcut matching
 * Contains the key and already-normalized modifiers
 */
export interface NormalizedKeyboardInput {
  key?: string;
  modifiers: InputModifiers;
}

/**
 * Defines a keyboard shortcut binding with a key
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export interface KeyboardShortcutBinding {
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
 * Defines a modifier-only shortcut binding (for pointer events)
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export interface ModifierOnlyShortcutBinding {
  /**
   * Key must not be present for modifier-only bindings
   */
  key?: never;
  /** Required modifier keys - at least one modifier is typically required */
  modifiers: Partial<InputModifiers>;
}

/**
 * Union of all possible shortcut bindings
 * @category Types/Configuration/Shortcuts
 */
export type ShortcutBinding = KeyboardShortcutBinding | ModifierOnlyShortcutBinding;

/**
 * Keyboard shortcut definition with key-based bindings
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export interface KeyboardShortcutDefinition {
  /** Action name for keyboard events */
  actionName: KeyboardActionName;
  /** Key-based bindings (at least one must have a key) */
  bindings: (KeyboardShortcutBinding | ModifierOnlyShortcutBinding)[];
}

/**
 * Pointer-only shortcut definition with modifier-only bindings
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export interface PointerOnlyShortcutDefinition {
  /** Action name for pointer events */
  actionName: PointerOnlyActionName;
  /** Modifier-only bindings (keys are not allowed) */
  bindings: ModifierOnlyShortcutBinding[];
}

/**
 * Pointer-only shortcut definition with modifier-only bindings
 *
 * @public
 * @since 1.0.1
 * @category Types/Configuration/Shortcuts
 */
export interface WheelOnlyShortcutDefinition {
  /** Action name for wheel events */
  actionName: WheelOnlyActionName;
  /** Modifier-only bindings (keys are not allowed) */
  bindings: ModifierOnlyShortcutBinding[];
}

/**
 * Shortcut definition for registering keyboard and pointer shortcuts
 *
 * This is a discriminated union that enforces:
 * - Pointer-only actions (multiSelection, boxSelection) can only have modifier-only bindings
 * - Wheel-only actions (zoom)
 * - Keyboard actions must have at least one key-based binding
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type ShortcutDefinition =
  | KeyboardShortcutDefinition
  | PointerOnlyShortcutDefinition
  | WheelOnlyShortcutDefinition;
