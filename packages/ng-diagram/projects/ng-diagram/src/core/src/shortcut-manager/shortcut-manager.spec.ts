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

      // Delete binding has no modifiers, so pressing Delete WITH primary modifier should NOT match
      // This ensures exact modifier matching
      const deleteMatch = matches.find((m) => m.actionName === 'deleteSelection');
      expect(deleteMatch).toBeUndefined();
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

    it('should match modifier-only shortcut when no key is provided', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
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

    it('should match modifier-only shortcut with primary modifier when no key provided', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'preserveSelection',
          bindings: [{ modifiers: { primary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(input);

      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('preserveSelection');
    });

    it('should NOT match modifier-only shortcut when a key is pressed (keyboard events)', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
        {
          actionName: 'preserveSelection',
          bindings: [{ modifiers: { primary: true } }],
        },
      ];

      // Test with regular key - should NOT match modifier-only shortcuts
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
      expect(matchesRegular.length).toBe(0);

      // Test with Ctrl+C - should NOT match preserveSelection (modifier-only)
      const inputCtrlC: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matchesCtrlC = shortcutManager.match(inputCtrlC);
      expect(matchesCtrlC.every((m) => m.actionName !== 'preserveSelection')).toBe(true);
    });

    it('should not match modifier-only shortcut when modifier is not active', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { secondary: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
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

    it('should match modifier-only shortcut with multiple modifiers when no key provided', () => {
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { primary: true, shift: true } }],
        },
      ];

      const input: NormalizedKeyboardInput = {
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

      // Should match only the modifier-only shortcut (no key in input)
      const inputModifierOnly: NormalizedKeyboardInput = {
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

    it('should not trigger preserveSelection when pressing Ctrl+C (keyboard event)', () => {
      // Regression test for bug where modifier-only shortcuts were matching keyboard events
      // Context: When user presses Ctrl+C, it should only trigger 'copy', not 'preserveSelection'
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'copy',
          bindings: [{ key: 'c', modifiers: { primary: true } }],
        },
        {
          actionName: 'preserveSelection',
          bindings: [{ modifiers: { primary: true } }], // Modifier-only (for pointer events)
        },
      ];

      // User presses Ctrl+C (keyboard event)
      const keyboardInput: NormalizedKeyboardInput = {
        key: 'c',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(keyboardInput);

      // Should only match 'copy', NOT 'preserveSelection'
      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('copy');
      expect(matches.every((m) => m.actionName !== 'preserveSelection')).toBe(true);
    });

    it('should trigger preserveSelection only for pointer events (no key)', () => {
      // Context: preserveSelection is a modifier-only shortcut for pointer interactions
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'copy',
          bindings: [{ key: 'c', modifiers: { primary: true } }],
        },
        {
          actionName: 'preserveSelection',
          bindings: [{ modifiers: { primary: true } }], // Modifier-only (for pointer events)
        },
      ];

      // User clicks with Ctrl held (pointer event - no key)
      const pointerInput: NormalizedKeyboardInput = {
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const matches = shortcutManager.match(pointerInput);

      // Should only match 'preserveSelection', NOT 'copy' (which requires key 'c')
      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('preserveSelection');
    });

    it('should not trigger boxSelection when pressing Shift+A (keyboard event)', () => {
      // Regression test: boxSelection is modifier-only for pointer events
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ modifiers: { shift: true } }],
        },
        {
          actionName: 'keyboardMoveSelectionUp',
          bindings: [{ key: 'A', modifiers: { shift: true } }],
        },
      ];

      // User presses Shift+A (keyboard event)
      const keyboardInput: NormalizedKeyboardInput = {
        key: 'A',
        modifiers: {
          primary: false,
          secondary: false,
          shift: true,
          meta: false,
        },
      };

      const matches = shortcutManager.match(keyboardInput);

      // Should only match key-based shortcut, NOT modifier-only boxSelection
      expect(matches.length).toBe(1);
      expect(matches[0].actionName).toBe('keyboardMoveSelectionUp');
      expect(matches.every((m) => m.actionName !== 'boxSelection')).toBe(true);
    });

    it('should support both keyboard and pointer triggers with multiple bindings', () => {
      // Use case: User wants Ctrl+B (keyboard) OR Ctrl+click (pointer) for box selection
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [
            { key: 'b', modifiers: { primary: true } }, // Keyboard trigger
            { modifiers: { primary: true } }, // Pointer trigger
          ],
        },
      ];

      // Test keyboard event: Ctrl+B
      const keyboardInput: NormalizedKeyboardInput = {
        key: 'b',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const keyboardMatches = shortcutManager.match(keyboardInput);
      expect(keyboardMatches.length).toBe(1);
      expect(keyboardMatches[0].actionName).toBe('boxSelection');

      // Test pointer event: Ctrl held (no key)
      const pointerInput: NormalizedKeyboardInput = {
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const pointerMatches = shortcutManager.match(pointerInput);
      expect(pointerMatches.length).toBe(1);
      expect(pointerMatches[0].actionName).toBe('boxSelection');
    });

    it('should NOT match pointer event when binding requires a key', () => {
      // User defines ONLY keyboard binding (Ctrl+B)
      mockFlowCore.config.shortcuts = [
        {
          actionName: 'boxSelection',
          bindings: [{ key: 'b', modifiers: { primary: true } }], // Only keyboard binding
        },
      ];

      // Keyboard event: Ctrl+B - SHOULD match
      const keyboardInput: NormalizedKeyboardInput = {
        key: 'b',
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const keyboardMatches = shortcutManager.match(keyboardInput);
      expect(keyboardMatches.length).toBe(1);
      expect(keyboardMatches[0].actionName).toBe('boxSelection');

      // Pointer event: Ctrl held - SHOULD NOT match (binding requires key 'b')
      const pointerInput: NormalizedKeyboardInput = {
        modifiers: {
          primary: true,
          secondary: false,
          shift: false,
          meta: false,
        },
      };

      const pointerMatches = shortcutManager.match(pointerInput);
      expect(pointerMatches.length).toBe(0); // No match because binding requires 'b' key
    });

    describe('exact modifier matching - regression tests', () => {
      it('should NOT match shortcut with only "A" when pressing "A + Command"', () => {
        // Regression test for the exact issue reported
        // If user defines two shortcuts: one with just "A", another with "A + Command"
        // Pressing "A + Command" should ONLY match the second shortcut
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'keyboardPanLeft',
            bindings: [{ key: 'a' }], // No modifiers
          },
          {
            actionName: 'selectAll',
            bindings: [{ key: 'a', modifiers: { primary: true } }], // With primary (Command/Ctrl)
          },
        ];

        // User presses A + Command
        const input: NormalizedKeyboardInput = {
          key: 'a',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: false,
          },
        };

        const matches = shortcutManager.match(input);

        // Should ONLY match selectAll, NOT keyboardPanLeft
        expect(matches.length).toBe(1);
        expect(matches[0].actionName).toBe('selectAll');
        expect(matches.some((m) => m.actionName === 'keyboardPanLeft')).toBe(false);
      });

      it('should NOT match shortcut with "A + Command" when pressing only "A"', () => {
        // The reverse case: pressing "A" without modifiers should not match "A + Command"
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'keyboardPanLeft',
            bindings: [{ key: 'a' }], // No modifiers
          },
          {
            actionName: 'selectAll',
            bindings: [{ key: 'a', modifiers: { primary: true } }], // With primary (Command/Ctrl)
          },
        ];

        // User presses just A (no modifiers)
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

        // Should ONLY match keyboardPanLeft, NOT selectAll
        expect(matches.length).toBe(1);
        expect(matches[0].actionName).toBe('keyboardPanLeft');
        expect(matches.some((m) => m.actionName === 'selectAll')).toBe(false);
      });

      it('should NOT match when extra modifiers are pressed beyond what binding requires', () => {
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'cut',
            bindings: [{ key: 'k', modifiers: { primary: true } }],
          },
        ];

        // User presses K + Command + Shift (extra shift modifier)
        const input: NormalizedKeyboardInput = {
          key: 'k',
          modifiers: {
            primary: true,
            secondary: false,
            shift: true, // Extra modifier not in binding
            meta: false,
          },
        };

        const matches = shortcutManager.match(input);

        // Should NOT match because shift is pressed but not in binding
        expect(matches).toEqual([]);
      });

      it('should match only shortcuts with exact modifier combination', () => {
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'keyboardPanLeft',
            bindings: [{ key: 's' }],
          },
          {
            actionName: 'copy',
            bindings: [{ key: 's', modifiers: { primary: true } }],
          },
          {
            actionName: 'boxSelection',
            bindings: [{ key: 's', modifiers: { shift: true } }],
          },
          {
            actionName: 'undo',
            bindings: [{ key: 's', modifiers: { primary: true, shift: true } }],
          },
        ];

        // Test 1: Press S alone
        const inputNoMods: NormalizedKeyboardInput = {
          key: 's',
          modifiers: { primary: false, secondary: false, shift: false, meta: false },
        };
        expect(shortcutManager.match(inputNoMods).map((m) => m.actionName)).toEqual(['keyboardPanLeft']);

        // Test 2: Press S + Command
        const inputPrimary: NormalizedKeyboardInput = {
          key: 's',
          modifiers: { primary: true, secondary: false, shift: false, meta: false },
        };
        expect(shortcutManager.match(inputPrimary).map((m) => m.actionName)).toEqual(['copy']);

        // Test 3: Press S + Shift
        const inputShift: NormalizedKeyboardInput = {
          key: 's',
          modifiers: { primary: false, secondary: false, shift: true, meta: false },
        };
        expect(shortcutManager.match(inputShift).map((m) => m.actionName)).toEqual(['boxSelection']);

        // Test 4: Press S + Command + Shift
        const inputBoth: NormalizedKeyboardInput = {
          key: 's',
          modifiers: { primary: true, secondary: false, shift: true, meta: false },
        };
        expect(shortcutManager.match(inputBoth).map((m) => m.actionName)).toEqual(['undo']);
      });

      it('should require exact match for all modifier types', () => {
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'paste',
            bindings: [{ key: 't', modifiers: { secondary: true } }], // Only secondary (Alt)
          },
        ];

        // Test with wrong modifier type
        const inputWrongModifier: NormalizedKeyboardInput = {
          key: 't',
          modifiers: {
            primary: true, // Wrong modifier
            secondary: false,
            shift: false,
            meta: false,
          },
        };

        expect(shortcutManager.match(inputWrongModifier)).toEqual([]);

        // Test with correct modifier
        const inputCorrect: NormalizedKeyboardInput = {
          key: 't',
          modifiers: {
            primary: false,
            secondary: true, // Correct modifier
            shift: false,
            meta: false,
          },
        };

        expect(shortcutManager.match(inputCorrect).map((m) => m.actionName)).toEqual(['paste']);
      });

      it('should match selectAll with Command + A and not conflict with preserveSelection', () => {
        // Regression test for Command + A not working
        // This tests the real default shortcuts configuration
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'selectAll',
            bindings: [{ key: 'a', modifiers: { primary: true } }],
          },
          {
            actionName: 'preserveSelection',
            bindings: [{ modifiers: { primary: true } }], // Modifier-only (no key)
          },
        ];

        // User presses Command + A (keyboard event)
        const input: NormalizedKeyboardInput = {
          key: 'a',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: false,
          },
        };

        const matches = shortcutManager.match(input);

        // Should ONLY match selectAll, NOT preserveSelection
        // preserveSelection is modifier-only (no key), so it shouldn't match keyboard events
        expect(matches.length).toBe(1);
        expect(matches[0].actionName).toBe('selectAll');
        expect(matches.some((m) => m.actionName === 'preserveSelection')).toBe(false);
      });

      it('should match copy with Command + C from default shortcuts', () => {
        // Test another common shortcut to ensure the fix works generally
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'copy',
            bindings: [{ key: 'c', modifiers: { primary: true } }],
          },
        ];

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

      it('should work with ALL default shortcuts including selectAll', () => {
        // Use the ACTUAL default shortcuts to ensure nothing breaks
        mockFlowCore.config.shortcuts = DEFAULT_SHORTCUTS;

        // Test Command + A for selectAll
        const inputSelectAll: NormalizedKeyboardInput = {
          key: 'a',
          modifiers: { primary: true, secondary: false, shift: false, meta: false },
        };
        const matchesSelectAll = shortcutManager.match(inputSelectAll);
        expect(matchesSelectAll.length).toBe(1);
        expect(matchesSelectAll[0].actionName).toBe('selectAll');

        // Test Command + C for copy
        const inputCopy: NormalizedKeyboardInput = {
          key: 'c',
          modifiers: { primary: true, secondary: false, shift: false, meta: false },
        };
        const matchesCopy = shortcutManager.match(inputCopy);
        expect(matchesCopy.length).toBe(1);
        expect(matchesCopy[0].actionName).toBe('copy');

        // Test Delete without modifiers
        const inputDelete: NormalizedKeyboardInput = {
          key: 'Delete',
          modifiers: { primary: false, secondary: false, shift: false, meta: false },
        };
        const matchesDelete = shortcutManager.match(inputDelete);
        expect(matchesDelete.some((m) => m.actionName === 'deleteSelection')).toBe(true);

        // Test Delete WITH modifier should NOT match deleteSelection
        const inputDeleteWithMod: NormalizedKeyboardInput = {
          key: 'Delete',
          modifiers: { primary: true, secondary: false, shift: false, meta: false },
        };
        const matchesDeleteWithMod = shortcutManager.match(inputDeleteWithMod);
        expect(matchesDeleteWithMod.some((m) => m.actionName === 'deleteSelection')).toBe(false);
      });

      it('should handle macOS Command key where both primary and meta are true', () => {
        // On macOS, pressing Command sets both primary=true and meta=true
        // This test ensures shortcuts still work in this scenario
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'selectAll',
            bindings: [{ key: 'a', modifiers: { primary: true } }],
          },
          {
            actionName: 'copy',
            bindings: [{ key: 'c', modifiers: { primary: true } }],
          },
        ];

        // Simulate macOS: Command + A (both primary and meta are true)
        const inputSelectAll: NormalizedKeyboardInput = {
          key: 'a',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: true, // Also true on macOS when Command is pressed
          },
        };

        const matchesSelectAll = shortcutManager.match(inputSelectAll);
        expect(matchesSelectAll.length).toBe(1);
        expect(matchesSelectAll[0].actionName).toBe('selectAll');

        // Simulate macOS: Command + C
        const inputCopy: NormalizedKeyboardInput = {
          key: 'c',
          modifiers: {
            primary: true,
            secondary: false,
            shift: false,
            meta: true, // Also true on macOS when Command is pressed
          },
        };

        const matchesCopy = shortcutManager.match(inputCopy);
        expect(matchesCopy.length).toBe(1);
        expect(matchesCopy[0].actionName).toBe('copy');
      });

      it('should respect meta modifier when explicitly specified in binding', () => {
        // When a binding explicitly requires meta, it should be checked
        mockFlowCore.config.shortcuts = [
          {
            actionName: 'redo',
            bindings: [{ key: 'm', modifiers: { meta: true } }],
          },
        ];

        // Should match when meta is true
        const inputMetaTrue: NormalizedKeyboardInput = {
          key: 'm',
          modifiers: { primary: false, secondary: false, shift: false, meta: true },
        };
        expect(shortcutManager.match(inputMetaTrue).map((m) => m.actionName)).toEqual(['redo']);

        // Should NOT match when meta is false
        const inputMetaFalse: NormalizedKeyboardInput = {
          key: 'm',
          modifiers: { primary: false, secondary: false, shift: false, meta: false },
        };
        expect(shortcutManager.match(inputMetaFalse)).toEqual([]);
      });
    });
  });
});
