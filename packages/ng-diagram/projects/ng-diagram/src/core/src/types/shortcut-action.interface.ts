import type { InputEventName } from '../input-events/input-events.interface';

/**
 * Keyboard movement actions that map to directional events
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardMoveSelectionAction =
  | 'keyboardMoveSelectionUp'
  | 'keyboardMoveSelectionDown'
  | 'keyboardMoveSelectionLeft'
  | 'keyboardMoveSelectionRight';

/**
 * Keyboard panning actions that map to directional events
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardPanAction = 'keyboardPanUp' | 'keyboardPanDown' | 'keyboardPanLeft' | 'keyboardPanRight';

/**
 * Pointer-only action names that can only be triggered by pointer events with modifiers
 * (e.g., Shift+Click, Ctrl+Click)
 * @category Types/Configuration/Shortcuts
 */
export type PointerOnlyActionName = 'multiSelection' | 'boxSelection';

/**
 * Keyboard action names that can be triggered by keyboard events
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardActionName =
  | KeyboardMoveSelectionAction
  | KeyboardPanAction
  | Extract<InputEventName, 'cut' | 'paste' | 'copy' | 'deleteSelection' | 'undo' | 'redo' | 'selectAll'>;

/**
 * All valid action names for shortcuts
 *
 * Includes:
 * - Keyboard actions (e.g., 'keyboardMoveSelectionUp', 'copy', 'selectAll')
 * - Pointer-only actions (e.g., 'multiSelection', 'boxSelection')
 * @category Types/Configuration/Shortcuts
 */
export type ShortcutActionName = KeyboardActionName | PointerOnlyActionName;
