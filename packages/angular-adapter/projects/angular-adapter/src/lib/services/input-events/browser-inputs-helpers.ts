import { InputModifiers } from '@angularflow/core';
import { getOS } from '../flow-core-provider/detect-environment';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent;

// General type guards
const isPointerEvent = (event: Event): event is PointerEvent => event instanceof PointerEvent;
const isKeyboardEvent = (event: Event): event is KeyboardEvent => event instanceof KeyboardEvent;
const isWheelEvent = (event: Event): event is WheelEvent => event instanceof WheelEvent;
const isDomEvent = (event: Event): event is DomEvent =>
  isPointerEvent(event) || isKeyboardEvent(event) || isWheelEvent(event);

// Modifier predicates
const getModifiers = (event: DomEvent): InputModifiers => {
  const isMac = getOS() === 'MacOS';

  return {
    primary: isMac ? event.metaKey : event.ctrlKey,
    secondary: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey,
  };
};
const withPrimaryModifier = (event: DomEvent): boolean => getModifiers(event).primary;
const withSecondaryModifier = (event: DomEvent): boolean => getModifiers(event).secondary;
const withShiftModifier = (event: DomEvent): boolean => getModifiers(event).shift;
const withMetaModifier = (event: DomEvent): boolean => getModifiers(event).meta;
const withoutModifiers = (event: DomEvent): boolean => {
  const modifiers = getModifiers(event);
  return !modifiers.primary && !modifiers.secondary && !modifiers.shift && !modifiers.meta;
};

// Button predicates
const withPrimaryButton = (event: Event) => isPointerEvent(event) && (event.button === undefined || event.button === 0);
const isArrowKeyPressed = (event: Event): boolean =>
  isKeyboardEvent(event) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
const isKeyPressed = (key: string) => (event: Event) => isKeyboardEvent(event) && event.key === key;
const isKeyComboPressed =
  (key: string, ...modifiers: (keyof InputModifiers)[]) =>
  (event: Event): boolean => {
    const isKeyboard = isKeyboardEvent(event);
    if (!isKeyboard) return false;

    const modifiersPressed = getModifiers(event);
    const requiredModsPressed = modifiers.every((mod) => modifiersPressed[mod]);
    if (!requiredModsPressed) return false;

    return isKeyPressed(key)(event);
  };
const isDeleteKeyPressed = (event: Event): boolean =>
  isKeyboardEvent(event) && (event.key === 'Delete' || event.key === 'Backspace');

export const BrowserInputsHelpers = {
  isPointerEvent,
  isKeyboardEvent,
  isWheelEvent,
  isDomEvent,

  getModifiers,
  withPrimaryModifier,
  withSecondaryModifier,
  withShiftModifier,
  withMetaModifier,
  withoutModifiers,

  withPrimaryButton,
  isArrowKeyPressed,
  isKeyPressed,
  isKeyComboPressed,
  isDeleteKeyPressed,
  // Add other helper functions as needed
};

// export const BrowserInputsHelpers = {
// export const isKeyboard = (event: __OLD__InputEvent): event is KeyboardInputEvent => event.source === 'keyboard';
// export const isPointer = (event: __OLD__InputEvent): event is PointerInputEvent => event.source === 'pointer';
// export const isWheel = (event: __OLD__InputEvent): event is WheelInputEvent => event.source === 'wheel';
// export const isGesture = (event: __OLD__InputEvent): event is GestureInputEvent => event.source === 'gesture';
// // Specific event type guards (matches your current usage)
// export const isRotateEvent = (event: __OLD__InputEvent): event is RotateEvent => event.name === 'rotate';
// export const isResizeEvent = (event: __OLD__InputEvent): event is ResizeEvent => event.name === 'resize';
// export const isConnectionEvent = (event: __OLD__InputEvent): event is ConnectionEvent => event.name === 'connection';
// export const isSelectEvent = (event: __OLD__InputEvent): event is SelectEvent => event.name === 'select';
// export const isDragEvent = (event: __OLD__InputEvent): event is DragEvent => event.name === 'drag';
// export const isPanEvent = (event: __OLD__InputEvent): event is PanEvent => event.name === 'pan';
// // Phase guards
// export const isStart = (event: __OLD__InputEvent): boolean => event.phase === 'start';
// export const isContinue = (event: __OLD__InputEvent): boolean => event.phase === 'continue';
// export const isEnd = (event: __OLD__InputEvent): boolean => event.phase === 'end';
// export const isAbort = (event: __OLD__InputEvent): boolean => event.phase === 'abort';
// // Modifier predicates
// export const __new__withPrimaryModifier = (event: __NEW__NEW__BaseInputEvent): boolean => event.modifiers.primary;
// export const withPrimaryModifier = (event: __OLD__InputEvent): boolean => event.modifiers.primary;
// export const withSecondaryModifier = (event: __OLD__InputEvent): boolean => event.modifiers.secondary;
// export const withShiftModifier = (event: __OLD__InputEvent): boolean => event.modifiers.shift;
// export const withMetaModifier = (event: __OLD__InputEvent): boolean => event.modifiers.meta;
// export const withoutModifiers = (event: __OLD__InputEvent): boolean =>
//   !event.modifiers.primary && !event.modifiers.secondary && !event.modifiers.shift && !event.modifiers.meta;
// // Button predicates
// export const withPrimaryButton = (event: __OLD__InputEvent): boolean =>
//   isPointer(event) && (event.button === undefined || event.button === 0);
// export const withMiddleButton = (event: __OLD__InputEvent): boolean => isPointer(event) && event.button === 1;
// export const withSecondaryButton = (event: __OLD__InputEvent): boolean => isPointer(event) && event.button === 2;
// // Keyboard-specific predicates
// export const isKey =
//   (key: string): InputActionPredicate =>
//   (event: __OLD__InputEvent) =>
//     isKeyboard(event) && event.key === key;
// export const isKeyCode =
//   (code: string): InputActionPredicate =>
//   (event: __OLD__InputEvent) =>
//     isKeyboard(event) && event.code === code;
// export const isArrowKey = (event: __OLD__InputEvent): boolean =>
//   isKeyboard(event) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
// export const isDeleteKey = (event: __OLD__InputEvent): boolean =>
//   isKeyboard(event) && (event.key === 'Delete' || event.key === 'Backspace');
// export const isEnterKey = (event: __OLD__InputEvent): boolean => isKeyboard(event) && event.key === 'Enter';
// export const isEscapeKey = (event: __OLD__InputEvent): boolean => isKeyboard(event) && event.key === 'Escape';
// export const isSpaceKey = (event: __OLD__InputEvent): boolean => isKeyboard(event) && event.key === ' ';
// };
