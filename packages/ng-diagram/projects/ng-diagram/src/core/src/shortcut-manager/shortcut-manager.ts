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
   * Check if a normalized keyboard input matches a shortcut binding
   *
   * Compares:
   * - Key values
   * - Modifier states
   *
   * @param input - Normalized keyboard input
   * @param binding - Shortcut binding to match against
   * @returns true if the input matches the binding
   */
  private matchBinding(input: NormalizedKeyboardInput, binding: ShortcutBinding): boolean {
    if (input.key !== binding.key) {
      return false;
    }

    if (binding.modifiers) {
      if (binding.modifiers.primary !== undefined && input.modifiers.primary !== binding.modifiers.primary) {
        return false;
      }

      if (binding.modifiers.shift !== undefined && input.modifiers.shift !== binding.modifiers.shift) {
        return false;
      }

      if (binding.modifiers.secondary !== undefined && input.modifiers.secondary !== binding.modifiers.secondary) {
        return false;
      }

      if (binding.modifiers.meta !== undefined && input.modifiers.meta !== binding.modifiers.meta) {
        return false;
      }
    }

    return true;
  }
}
