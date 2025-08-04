import { InputModifiers } from '@angularflow/core';
import { getOS } from '../../utils/detect-environment';

type DomEvent = KeyboardEvent | WheelEvent | PointerEvent | DragEvent | TouchEvent;

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
