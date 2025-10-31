import { ShortcutDefinition } from '../types/shortcut.interface';

/**
 * Default keyboard shortcuts for ng-diagram
 */
export const DEFAULT_SHORTCUTS = [
  // Clipboard operations
  {
    actionName: 'copy',
    bindings: [{ key: 'c', modifiers: { primary: true } }],
  },
  {
    actionName: 'cut',
    bindings: [{ key: 'x', modifiers: { primary: true } }],
  },
  {
    actionName: 'paste',
    bindings: [{ key: 'v', modifiers: { primary: true } }],
  },

  // Delete selection
  {
    actionName: 'deleteSelection',
    bindings: [{ key: 'Delete' }, { key: 'Backspace' }],
  },

  // Move selected nodes with arrow keys
  {
    actionName: 'keyboardMoveSelectionUp',
    bindings: [{ key: 'ArrowUp' }],
  },
  {
    actionName: 'keyboardMoveSelectionDown',
    bindings: [{ key: 'ArrowDown' }],
  },
  {
    actionName: 'keyboardMoveSelectionLeft',
    bindings: [{ key: 'ArrowLeft' }],
  },
  {
    actionName: 'keyboardMoveSelectionRight',
    bindings: [{ key: 'ArrowRight' }],
  },

  // Pan viewport with arrow keys
  {
    actionName: 'keyboardPanUp',
    bindings: [{ key: 'ArrowUp' }],
  },
  {
    actionName: 'keyboardPanDown',
    bindings: [{ key: 'ArrowDown' }],
  },
  {
    actionName: 'keyboardPanLeft',
    bindings: [{ key: 'ArrowLeft' }],
  },
  {
    actionName: 'keyboardPanRight',
    bindings: [{ key: 'ArrowRight' }],
  },
] satisfies ShortcutDefinition[];
