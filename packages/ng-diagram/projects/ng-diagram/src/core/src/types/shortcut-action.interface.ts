import type { InputEventName } from '../input-events/input-events.interface';

/**
 * Keyboard movement actions that map to directional events
 */
export type KeyboardMoveSelectionAction =
  | 'keyboardMoveSelectionUp'
  | 'keyboardMoveSelectionDown'
  | 'keyboardMoveSelectionLeft'
  | 'keyboardMoveSelectionRight';

/**
 * Keyboard panning actions that map to directional events
 */
export type KeyboardPanAction = 'keyboardPanUp' | 'keyboardPanDown' | 'keyboardPanLeft' | 'keyboardPanRight';

/**
 * All valid action names for shortcuts
 *
 * Includes:
 * - Specific mapped actions (e.g., 'keyboardMoveSelectionUp', 'keyboardPanUp')
 * - Direct event names (e.g., 'copy', 'cut', 'deleteSelection')
 * @category Types
 */
export type ShortcutActionName =
  | KeyboardMoveSelectionAction
  | KeyboardPanAction
  | Extract<InputEventName, 'cut' | 'paste' | 'copy' | 'deleteSelection' | 'boxSelection' | 'undo' | 'redo'>
  | 'preserveSelection';
