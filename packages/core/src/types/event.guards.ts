import {
  Event,
  KeyboardEvent,
  PointerDownEvent,
  PointerEnterEvent,
  PointerEvent,
  PointerLeaveEvent,
  PointerMoveEvent,
  PointerUpEvent,
} from './event.interface';

/**
 * Check if an event is a keyboard down event
 */
export const isKeyboardDownEvent = (event: Event): event is KeyboardEvent => {
  return event.type === 'keydown';
};

/**
 * Check if an event is a keyboard up event
 */
export const isKeyboardUpEvent = (event: Event): event is KeyboardEvent => {
  return event.type === 'keyup';
};

/**
 * Check if an event is a keyboard press event
 */
export const isKeyboardPressEvent = (event: Event): event is KeyboardEvent => {
  return event.type === 'keypress';
};

/**
 * Check if an event is a keyboard event
 */
export const isKeyboardEvent = (event: Event): event is KeyboardEvent => {
  return isKeyboardDownEvent(event) || isKeyboardUpEvent(event) || isKeyboardPressEvent(event);
};

/**
 * Check if an event is a pointer down event
 */
export const isPointerDownEvent = (event: Event): event is PointerDownEvent => {
  return event.type === 'pointerdown';
};

/**
 * Check if an event is a pointer up event
 */
export const isPointerUpEvent = (event: Event): event is PointerUpEvent => {
  return event.type === 'pointerup';
};

/**
 * Check if an event is a pointer move event
 */
export const isPointerMoveEvent = (event: Event): event is PointerMoveEvent => {
  return event.type === 'pointermove';
};

/**
 * Check if an event is a pointer enter event
 */
export const isPointerEnterEvent = (event: Event): event is PointerEnterEvent => {
  return event.type === 'pointerenter';
};

/**
 * Check if an event is a pointer leave event
 */
export const isPointerLeaveEvent = (event: Event): event is PointerLeaveEvent => {
  return event.type === 'pointerleave';
};

/**
 * Check if an event is a pointer event
 */
export const isPointerEvent = (event: Event): event is PointerEvent => {
  return (
    isPointerDownEvent(event) ||
    isPointerUpEvent(event) ||
    isPointerMoveEvent(event) ||
    isPointerEnterEvent(event) ||
    isPointerLeaveEvent(event)
  );
};
