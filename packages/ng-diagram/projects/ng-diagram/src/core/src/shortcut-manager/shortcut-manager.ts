import type { FlowCore } from '../flow-core';
import { NormalizedKeyboardInput, ShortcutBinding, ShortcutDefinition } from '../types/shortcut.interface';
import { DEFAULT_SHORTCUTS } from './default-shortcuts';

/**
 * Merges user shortcuts with base shortcuts, user shortcuts override by actionName
 *
 * @param userShortcuts - User-provided shortcuts that will override matching base shortcuts
 * @param baseShortcuts - Base shortcuts to merge with. Optional parameter that defaults to DEFAULT_SHORTCUTS array
 * @returns Merged shortcut definitions
 *
 * @category Other
 */
export function configureShortcuts(
  userShortcuts: ShortcutDefinition[],
  baseShortcuts: ShortcutDefinition[] = DEFAULT_SHORTCUTS
): ShortcutDefinition[] {
  const shortcutMap = new Map<string, ShortcutDefinition>();

  // Add all base shortcuts to the map
  for (const shortcut of baseShortcuts) {
    shortcutMap.set(shortcut.actionName, shortcut);
  }

  // Override with user shortcuts
  for (const shortcut of userShortcuts) {
    shortcutMap.set(shortcut.actionName, shortcut);
  }

  return Array.from(shortcutMap.values());
}

/**
 * Manages keyboard shortcuts and input event matching
 *
 * Supports two types of shortcuts:
 * 1. Key-based shortcuts: Require a specific key with optional modifiers (e.g., Ctrl+C for copy)
 * 2. Modifier-only shortcuts: Require only modifier keys without a specific key (e.g., Alt for box-selection)
 *
 * @example
 * // Key-based shortcut
 * {
 *   actionName: 'copy',
 *   bindings: [{ key: 'c', modifiers: { primary: true } }]
 * }
 *
 * @example
 * // Modifier-only shortcut (useful for modal interactions like box-selection)
 * {
 *   actionName: 'boxSelection',
 *   bindings: [{ modifiers: { secondary: true } }] // Triggered when Alt is pressed
 * }
 */
export class ShortcutManager {
  constructor(private readonly flowCore: FlowCore) {}

  /**
   * Find all matching shortcuts for normalized keyboard input
   *
   * Each shortcut must have a binding that matches the input
   *
   * @param input - Normalized keyboard input (key + already-normalized modifiers)
   * @returns Array of matching shortcut definitions (empty if no matches)
   */
  match(input: NormalizedKeyboardInput): ShortcutDefinition[] {
    const { shortcuts } = this.flowCore.config;
    const matches: ShortcutDefinition[] = [];

    for (const shortcut of shortcuts) {
      for (const binding of shortcut.bindings) {
        if (this.matchBinding(input, binding)) {
          matches.push(shortcut);
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Check if the current modifiers match any binding for a specific action
   *
   * Useful for checking modifier-only shortcuts (like box-selection triggered by pointer events)
   *
   * @param actionName - The action name to check
   * @param modifiers - The current modifier state
   * @returns true if any binding for this action matches the modifiers
   *
   * @example
   * // Check if current modifiers match box selection shortcut
   * if (shortcutManager.matchesAction('boxSelection', event.modifiers)) {
   *   // Start box selection
   * }
   */
  matchesAction(actionName: string, input: NormalizedKeyboardInput): boolean {
    const { shortcuts } = this.flowCore.config;
    const shortcut = shortcuts.find((s) => s.actionName === actionName);

    if (!shortcut) {
      return false;
    }

    // Check if any binding's modifiers match
    return shortcut.bindings.some((binding) => this.matchBinding(input, binding));
  }

  /**
   * Check if a normalized keyboard input matches a shortcut binding
   *
   * Compares:
   * - Key values (if specified in binding)
   * - Modifier states
   *
   * @param input - Normalized keyboard input
   * @param binding - Shortcut binding to match against
   * @returns true if the input matches the binding
   */
  private matchBinding(input: NormalizedKeyboardInput, binding: ShortcutBinding): boolean {
    // If binding specifies a key, it must match
    if (binding.key !== undefined && input.key !== binding.key) {
      return false;
    }

    return this.matchModifiers(input.modifiers, binding);
  }

  /**
   * Check if modifiers match a binding's modifier requirements
   *
   * @param modifiers - Current modifier state
   * @param binding - Shortcut binding to match against
   * @returns true if modifiers match the binding's requirements
   */
  private matchModifiers(modifiers: NormalizedKeyboardInput['modifiers'], binding: ShortcutBinding): boolean {
    if (!binding.modifiers) {
      return true;
    }

    if (binding.modifiers.primary !== undefined && modifiers.primary !== binding.modifiers.primary) {
      return false;
    }

    if (binding.modifiers.shift !== undefined && modifiers.shift !== binding.modifiers.shift) {
      return false;
    }

    if (binding.modifiers.secondary !== undefined && modifiers.secondary !== binding.modifiers.secondary) {
      return false;
    }

    if (binding.modifiers.meta !== undefined && modifiers.meta !== binding.modifiers.meta) {
      return false;
    }

    return true;
  }
}
