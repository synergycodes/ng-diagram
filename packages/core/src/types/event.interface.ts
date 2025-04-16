/**
 * Base interface for all events
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
}

/**
 * Keyboard event types
 */
export type KeyboardEventType = 'keydown' | 'keyup' | 'keypress';

/**
 * Keyboard event interface
 */
export interface KeyboardEvent extends BaseEvent {
  type: KeyboardEventType;
  key: string;
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * Pointer event types
 */
export type PointerEventType = 'pointerdown' | 'pointerup' | 'pointermove' | 'pointerenter' | 'pointerleave';

/**
 * Pointer event interface
 */
export interface PointerEvent extends BaseEvent {
  type: PointerEventType;
  x: number;
  y: number;
  pressure: number;
  button: number;
  buttons: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}

/**
 * Viewport size change event interface
 */
export interface ViewportSizeChangeEvent extends BaseEvent {
  type: 'viewportSizeChange';
  width: number;
  height: number;
}

/**
 * Union type of all possible events
 */
export type Event = KeyboardEvent | PointerEvent | ViewportSizeChangeEvent;
