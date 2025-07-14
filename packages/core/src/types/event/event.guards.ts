import { InputActionPredicate } from '../input-event-handler.abstract';
import {
  ConnectionEvent,
  DragEvent,
  GestureInputEvent,
  InputEvent,
  KeyboardInputEvent,
  PanEvent,
  PointerInputEvent,
  ResizeEvent,
  RotateEvent,
  SelectEvent,
  WheelInputEvent,
} from './event.interface';

export const isKeyboard = (event: InputEvent): event is KeyboardInputEvent => event.source === 'keyboard';
export const isPointer = (event: InputEvent): event is PointerInputEvent => event.source === 'pointer';
export const isWheel = (event: InputEvent): event is WheelInputEvent => event.source === 'wheel';
export const isGesture = (event: InputEvent): event is GestureInputEvent => event.source === 'gesture';

// Specific event type guards (matches your current usage)
export const isRotateEvent = (event: InputEvent): event is RotateEvent => event.name === 'rotate';
export const isResizeEvent = (event: InputEvent): event is ResizeEvent => event.name === 'resize';
export const isConnectionEvent = (event: InputEvent): event is ConnectionEvent => event.name === 'connection';
export const isSelectEvent = (event: InputEvent): event is SelectEvent => event.name === 'select';
export const isDragEvent = (event: InputEvent): event is DragEvent => event.name === 'drag';
export const isPanEvent = (event: InputEvent): event is PanEvent => event.name === 'pan';

// Phase guards
export const isStart = (event: InputEvent): boolean => event.phase === 'start';
export const isContinue = (event: InputEvent): boolean => event.phase === 'continue';
export const isEnd = (event: InputEvent): boolean => event.phase === 'end';
export const isAbort = (event: InputEvent): boolean => event.phase === 'abort';

// Modifier predicates
export const withPrimaryModifier = (event: InputEvent): boolean => event.modifiers.primary;
export const withSecondaryModifier = (event: InputEvent): boolean => event.modifiers.secondary;
export const withShiftModifier = (event: InputEvent): boolean => event.modifiers.shift;
export const withMetaModifier = (event: InputEvent): boolean => event.modifiers.meta;
export const withoutModifiers = (event: InputEvent): boolean =>
  !event.modifiers.primary && !event.modifiers.secondary && !event.modifiers.shift && !event.modifiers.meta;

// Button predicates
export const withPrimaryButton = (event: InputEvent): boolean =>
  isPointer(event) && (event.button === undefined || event.button === 0);
export const withMiddleButton = (event: InputEvent): boolean => isPointer(event) && event.button === 1;
export const withSecondaryButton = (event: InputEvent): boolean => isPointer(event) && event.button === 2;

// Keyboard-specific predicates
export const isKey =
  (key: string): InputActionPredicate =>
  (event: InputEvent) =>
    isKeyboard(event) && event.key === key;
export const isKeyCode =
  (code: string): InputActionPredicate =>
  (event: InputEvent) =>
    isKeyboard(event) && event.code === code;
export const isArrowKey = (event: InputEvent): boolean =>
  isKeyboard(event) && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key);
export const isDeleteKey = (event: InputEvent): boolean =>
  isKeyboard(event) && (event.key === 'Delete' || event.key === 'Backspace');
export const isEnterKey = (event: InputEvent): boolean => isKeyboard(event) && event.key === 'Enter';
export const isEscapeKey = (event: InputEvent): boolean => isKeyboard(event) && event.key === 'Escape';
export const isSpaceKey = (event: InputEvent): boolean => isKeyboard(event) && event.key === ' ';
