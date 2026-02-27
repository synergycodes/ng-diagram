import type { InputEventName } from '../input-events/input-events.interface';

/**
 * Keyboard movement actions that map to directional events
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardMoveSelectionAction =
  | 'keyboardMoveSelectionUp'
  | 'keyboardMoveSelectionDown'
  | 'keyboardMoveSelectionLeft'
  | 'keyboardMoveSelectionRight';

/**
 * Keyboard panning actions that map to directional events
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardPanAction = 'keyboardPanUp' | 'keyboardPanDown' | 'keyboardPanLeft' | 'keyboardPanRight';

/**
 * Keyboard zooming actions
 *
 * @public
 * @since 1.1.0
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardZoomAction = 'keyboardZoomIn' | 'keyboardZoomOut';

/**
 * Pointer-only action names that can only be triggered by pointer events with modifiers
 * (e.g., Shift+Click, Ctrl+Click)
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type PointerOnlyActionName = 'multiSelection' | 'boxSelection';

/**
 * Wheel-only action names that can only be triggered by wheel events with modifiers
 * (e.g., Shift+Wheel, Ctrl+Wheel)
 *
 * @public
 * @since 1.1.0
 * @category Types/Configuration/Shortcuts
 */
export type WheelOnlyActionName = 'zoom';

/**
 * Keyboard action names that can be triggered by keyboard events
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type KeyboardActionName =
  | KeyboardMoveSelectionAction
  | KeyboardPanAction
  | KeyboardZoomAction
  | Extract<InputEventName, 'cut' | 'paste' | 'copy' | 'deleteSelection' | 'undo' | 'redo' | 'selectAll'>;

/**
 * All valid action names for shortcuts
 *
 * Includes:
 * - Keyboard actions (e.g., 'keyboardMoveSelectionUp', 'copy', 'selectAll')
 * - Pointer-only actions (e.g., 'multiSelection', 'boxSelection')
 * - Wheel-only actions (e.g. 'zoom')
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Shortcuts
 */
export type ShortcutActionName = KeyboardActionName | PointerOnlyActionName | WheelOnlyActionName;
