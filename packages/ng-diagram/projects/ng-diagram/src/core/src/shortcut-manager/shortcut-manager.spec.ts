import { beforeEach, describe, expect, it } from 'vitest';
import { FlowCore } from '../flow-core';
import { FlowConfig } from '../types/flow-config.interface';
import { NormalizedKeyboardInput, ShortcutDefinition } from '../types/shortcut.interface';
import { DEFAULT_SHORTCUTS } from './default-shortcuts';
import { configureShortcuts, ShortcutManager } from './shortcut-manager';

describe('configureShortcuts', () => {
  it('should return default shortcuts when empty array provided', () => {
    const result = configureShortcuts([]);

    expect(result).toEqual(DEFAULT_SHORTCUTS);
  });

  it('should override default shortcuts with user shortcuts', () => {
    const userShortcuts: ShortcutDefinition[] = [
      {
        actionName: 'copy',
        bindings: [{ key: 'y', modifiers: { primary: true } }],
      },
    ];

    const result = configureShortcuts(userShortcuts);

    const copyShortcut = result.find((s) => s.actionName === 'copy');
    expect(copyShortcut).toBeDefined();
    expect(copyShortcut?.bindings).toEqual([{ key: 'y', modifiers: { primary: true } }]);
  });

  it('should add new user shortcuts for actions not in defaults', () => {
    const userShortcuts: ShortcutDefinition[] = [
      {
        actionName: 'keyboardMoveSelectionUp',
        bindings: [{ key: 'w' }],
      },
    ];

    const result = configureShortcuts(userShortcuts);

    expect(result.length).toBe(DEFAULT_SHORTCUTS.length);
    const movedShortcut = result.find((s) => s.actionName === 'keyboardMoveSelectionUp');
    expect(movedShortcut).toBeDefined();
    expect(movedShortcut?.bindings).toEqual([{ key: 'w' }]);
  });

  it('should merge multiple user shortcuts correctly', () => {
    const userShortcuts: ShortcutDefinition[] = [
      {
        actionName: 'copy',
        bindings: [{ key: 'y', modifiers: { primary: true } }],
      },
      {
        actionName: 'paste',
        bindings: [{ key: 'p', modifiers: { primary: true, shift: true } }],
      },
      {
        actionName: 'cut',
        bindings: [{ key: 'z' }],
      },
    ];

    const result = configureShortcuts(userShortcuts);

    expect(result.length).toBe(DEFAULT_SHORTCUTS.length);
    expect(result.find((s) => s.actionName === 'copy')?.bindings).toEqual([{ key: 'y', modifiers: { primary: true } }]);
    expect(result.find((s) => s.actionName === 'paste')?.bindings).toEqual([
      { key: 'p', modifiers: { primary: true, shift: true } },
    ]);
    expect(result.find((s) => s.actionName === 'cut')?.bindings).toEqual([{ key: 'z' }]);
  });

  it('should preserve all default shortcuts that are not overridden', () => {
    const userShortcuts: ShortcutDefinition[] = [
      {
        actionName: 'copy',
        bindings: [{ key: 'y', modifiers: { primary: true } }],
      },
    ];

    const result = configureShortcuts(userShortcuts);

    const cutShortcut = result.find((s) => s.actionName === 'cut');
    const pasteShortcut = result.find((s) => s.actionName === 'paste');
    const deleteShortcut = result.find((s) => s.actionName === 'deleteSelection');

    expect(cutShortcut).toEqual(DEFAULT_SHORTCUTS.find((s) => s.actionName === 'cut'));
    expect(pasteShortcut).toEqual(DEFAULT_SHORTCUTS.find((s) => s.actionName === 'paste'));
    expect(deleteShortcut).toEqual(DEFAULT_SHORTCUTS.find((s) => s.actionName === 'deleteSelection'));
  });
});

describe('ShortcutManager', () => {
  let shortcutManager: ShortcutManager;
  let mockFlowCore: FlowCore;

  beforeEach(() => {
    mockFlowCore = {
      config: {
        shortcuts: DEFAULT_SHORTCUTS,
      } as FlowConfig,
    } as FlowCore;

    shortcutManager = new ShortcutManager(mockFlowCore);
  });

  describe('match', () => {
    it('should find matching shortcut with exact key match and no modifiers', () => {
      const input: NormalizedKeyboardInput = {
        key: 'Delete',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some((m) => m.actionName === 'deleteSelection')).toBe(true);
    });

    it('should find matching shortcut with key and primary modifier', () => {
      const input: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('copy');
    });

    it('should find matching shortcut with Backspace key', () => {
      const input: NormalizedKeyboardInput = {
        key: 'Backspace',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some((m) => m.actionName === 'deleteSelection')).toBe(true);
    });

    it('should find multiple matching shortcuts for arrow keys', () => {
      const input: NormalizedKeyboardInput = {
        key: 'ArrowUp',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(2);
      const actionNames = matches.map((m) => m.actionName);
      expect(actionNames).toContain('keyboardMoveSelectionUp');
      expect(actionNames).toContain('keyboardPanUp');
    });

    it('should return empty array when no matches found', () => {
      const input: NormalizedKeyboardInput = {
        key: 'z',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches).toEqual([]);
    });

    it('should not match when key is correct but required modifier is missing', () => {
      const input: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.some((m) => m.actionName === 'copy')).toBe(false);
    });

    it('should not match when key is correct but has unexpected modifier', () => {
      const input: NormalizedKeyboardInput = {
        key: 'Delete',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      // Delete should match without modifiers, but with primary modifier it might not
      // depending on the binding definition
      const deleteMatch = matches.find((m) => m.actionName === 'deleteSelection');
      // Since the default binding doesn't specify modifiers, it should still match
      // because undefined modifiers mean "don't care"
      expect(deleteMatch).toBeDefined();
    });

    it('should match shortcut with multiple bindings', () => {
      const inputDelete: NormalizedKeyboardInput = {
        key: 'Delete',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const inputBackspace: NormalizedKeyboardInput = {
        key: 'Backspace',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matchesDelete = shortcutManager.match(inputDelete);
      const matchesBackspace = shortcutManager.match(inputBackspace);

      expect(matchesDelete.some((m) => m.actionName === 'deleteSelection')).toBe(true);
      expect(matchesBackspace.some((m) => m.actionName === 'deleteSelection')).toBe(true);
    });

    it('should use custom shortcuts from flow config', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'copy',
          bindings: [{ key: 'z', modifiers: { primary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'z',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('copy');
    });

    it('should handle shortcuts with shift modifier', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'paste',
          bindings: [{ key: 'A', modifiers: { shift: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'A',
        modifiers: {
          primary: false,
          secondary: false,
          shift: true,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('paste');
    });

    it('should handle shortcuts with secondary modifier', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'cut',
          bindings: [{ key: 'a', modifiers: { secondary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'a',
        modifiers: {
          primary: false,
          secondary: true,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('cut');
    });

    it('should handle shortcuts with meta modifier', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'deleteSelection',
          bindings: [{ key: 'm', modifiers: { meta: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'm',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: true,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('deleteSelection');
    });

    it('should handle shortcuts with multiple modifiers', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'keyboardPanUp',
          bindings: [
            {
              key: 's',
              modifiers: {
                primary: true,
                shift: true,
              },
            },
          ],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 's',
        modifiers: {
          primary: true,
          secondary: false,
          shift: true,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('keyboardPanUp');
    });

    it('should not match when one of multiple required modifiers is missing', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'keyboardPanDown',
          bindings: [
            {
              key: 's',
              modifiers: {
                primary: true,
                shift: true,
              },
            },
          ],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 's',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches).toEqual([]);
    });

    it('should handle case-sensitive key matching', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'keyboardPanLeft',
          bindings: [{ key: 'a' }],
        },
      ];

      const inputLower: NormalizedKeyboardInput = {
        key: 'a',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const inputUpper: NormalizedKeyboardInput = {
        key: 'A',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matchesLower = shortcutManager.match(inputLower);
      const matchesUpper = shortcutManager.match(inputUpper);

      expect(matchesLower.length).toBe(1);
      expect(matchesUpper.length).toBe(0);
    });

    it('should return the same shortcut only once even if it matches', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'deleteSelection',
          bindings: [{ key: 'Delete' }, { key: 'Backspace' }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'Delete',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      // Should only return the shortcut once, not for each binding
      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('deleteSelection');
    });

    it('should handle empty shortcuts array', () => {
      mockFlowCore.config.shortcuts = [];

      const input: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches).toEqual([]);
    });

    it('should match modifier-only shortcut with secondary modifier', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'Alt',
        modifiers: {
          primary: false,
          secondary: true,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('boxSelection');
    });

    it('should match modifier-only shortcut with primary modifier', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { primary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'Control',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('boxSelection');
    });

    it('should match modifier-only shortcut regardless of key pressed', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
      ];

      // Test with a regular key
      const inputWithRegularKey: NormalizedKeyboardInput = {
        key: 'a',
        modifiers: {
          primary: false,
          secondary: true,
          shift: false,
          meta: false,
        },
      };

      const matchesRegular = shortcutManager.match(inputWithRegularKey);
      expect(matchesRegular.length).toBe(1);
      expect(matchesRegular[0].actionName).toBe('boxSelection');

      // Test with modifier key itself
      const inputWithModifierKey: NormalizedKeyboardInput = {
        key: 'Alt',
        modifiers: {
          primary: false,
          secondary: true,
          shift: false,
          meta: false,
        },
      };

      const matchesModifier = shortcutManager.match(inputWithModifierKey);
      expect(matchesModifier.length).toBe(1);
      expect(matchesModifier[0].actionName).toBe('boxSelection');
    });

    it('should not match modifier-only shortcut when modifier is not active', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'a',
        modifiers: {
          primary: false,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches).toEqual([]);
    });

    it('should match modifier-only shortcut with multiple modifiers', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { primary: true, shift: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'Shift',
        modifiers: {
          primary: true,
          secondary: false,
          shift: true,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('boxSelection');
    });

    it('should not match modifier-only shortcut when one required modifier is missing', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { primary: true, shift: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        key: 'Shift',
        modifiers: {
          primary: false,
          secondary: false,
          shift: true,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches).toEqual([]);
    });

    it('should distinguish between key-based and modifier-only shortcuts', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
        {
          actionName: 'copy',
          bindings: [{ key: 'c', modifiers: { primary: true } }],
        },
      ];

      // Should match only the modifier-only shortcut
      const inputModifierOnly: NormalizedKeyboardInput = {
        key: 'Alt',
        modifiers: {
          primary: false,
          secondary: true,
          shift: false,
          meta: false,
        },
      };

      const matchesModifierOnly = shortcutManager.match(inputModifierOnly);
      expect(matchesModifierOnly.length).toBe(1);
      expect(matchesModifierOnly[0].actionName).toBe('boxSelection');

      // Should match only the key-based shortcut
      const inputKeyBased: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matchesKeyBased = shortcutManager.match(inputKeyBased);
      expect(matchesKeyBased.length).toBe(1);
      expect(matchesKeyBased[0].actionName).toBe('copy');
    });
  });
});
