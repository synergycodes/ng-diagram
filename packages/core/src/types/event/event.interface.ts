import { EventTarget, ResizeHandlePosition } from './event-target.interface';

export type InputSource = 'keyboard' | 'pointer' | 'wheel' | 'gesture';
// TODO: add loose autocomplete
export type EventType =
  | 'pan'
  | 'select'
  | 'resize'
  | 'connection'
  | 'drag'
  | 'rotate'
  | 'copy'
  | 'paste'
  | 'pinch'
  | 'swipe'
  | 'wheel'
  | 'press'
  | 'connection'
  | 'unknown';

export type InteractionPhase =
  | 'start' // Begin the interaction
  | 'continue' // Ongoing interaction
  | 'end' // Complete the interaction
  | 'abort'; // Interrupt the interaction (e.g. pointer up outside of the target)

export interface InputModifiers {
  primary: boolean; // Ctrl key (Windows/Linux) OR Cmd key (Mac)
  secondary: boolean; // Alt key
  shift: boolean; // Shift key
  meta: boolean; // Windows key OR Cmd key
}

export interface Coordinate {
  x: number;
  y: number;
}

// Base event types
export interface BaseInputEvent {
  id: string;
  originalEvent: string;
  timestamp: number;
  source: InputSource;
  phase: InteractionPhase;
  target: EventTarget;
  modifiers: InputModifiers;
  name: EventType;
}

// Base pointer event
export interface BasePointerEvent extends BaseInputEvent {
  source: 'pointer';
  pointerId: number;
  position: Coordinate;
  pressure: number;
  button?: number;
  pointerType: 'mouse' | 'touch' | 'pen';
}

// Keyboard events
export interface KeyboardInputEvent extends BaseInputEvent {
  source: 'keyboard';
  name: 'press';
  key: string;
  code: string;
}

// Wheel events
export interface WheelInputEvent extends BaseInputEvent {
  source: 'wheel';
  name: 'wheel';
  position: Coordinate;
  delta: Coordinate;
}

// Gesture events - multi-touch *only* gestures
export interface GestureInputEvent extends BaseInputEvent {
  source: 'gesture';
  name: 'pinch' | 'rotate' | 'swipe' | 'pan';
  center: Coordinate;
  pointers: BasePointerEvent[];
  scale?: number;
  rotation?: number;
  velocity?: Coordinate;
}

// Specific pointer event types
export interface RotateEvent extends BasePointerEvent {
  name: 'rotate';
  data: {
    mouse: Coordinate;
    handle: Coordinate;
    center: Coordinate;
  };
}

export interface ResizeEvent extends BasePointerEvent {
  name: 'resize';
  data: {
    handlePosition: ResizeHandlePosition;
    // initialRect: Rect;
    // currentRect: Rect;
  };
}

export interface ConnectionEvent extends BasePointerEvent {
  name: 'connection';
}

export interface SelectEvent extends BasePointerEvent {
  name: 'select';
}

export interface DragEvent extends BasePointerEvent {
  name: 'drag';
  data: {
    startPosition: Coordinate;
    deltaPosition: Coordinate;
  };
}

export interface PanEvent extends BasePointerEvent {
  name: 'pan';
  data: {
    startPosition: Coordinate;
    deltaPosition: Coordinate;
  };
}

export type PointerInputEvent =
  | RotateEvent
  | ResizeEvent
  | DragEvent
  | PanEvent
  | BasePointerEvent
  | ConnectionEvent
  | SelectEvent;

export type InputEvent = KeyboardInputEvent | PointerInputEvent | WheelInputEvent | GestureInputEvent;

export type EventByName<T extends EventType> = Extract<InputEvent, { name: T }>;
