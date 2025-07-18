// import { Point } from '../utils';
// import { EventTarget, ResizeHandlePosition } from './event-target.interface';

// /** @deprecated */
// export type InputSource = 'keyboard' | 'pointer' | 'wheel' | 'gesture';

// // TODO: add loose autocomplete
// /** @deprecated */
// export type EventType =
//   | 'pan'
//   | 'select'
//   | 'resize'
//   | 'connection'
//   | 'drag'
//   | 'rotate'
//   | 'copy'
//   | 'paste'
//   | 'pinch'
//   | 'swipe'
//   | 'wheel'
//   | 'press'
//   | 'connection'
//   | 'unknown';

// /** @deprecated */
// export type InteractionPhase =
//   | 'start' // Begin the interaction
//   | 'continue' // Ongoing interaction
//   | 'end' // Complete the interaction
//   | 'abort'; // Interrupt the interaction (e.g. pointer up outside of the target)

// /** @deprecated */
// export interface InputModifiers {
//   primary: boolean; // Ctrl key (Windows/Linux) OR Cmd key (Mac)
//   secondary: boolean; // Alt key
//   shift: boolean; // Shift key
//   meta: boolean; // Windows key OR Cmd key
// }

// /** @deprecated */
// export interface Coordinate {
//   x: number;
//   y: number;
// }

// // Base event types
// /** @deprecated */
// export interface BaseInputEvent {
//   id: string;
//   originalEvent: string;
//   timestamp: number;
//   source: InputSource;
//   phase: InteractionPhase;
//   target: EventTarget;
//   modifiers: InputModifiers;
//   name: EventType;
// }

// // Base pointer event
// /** @deprecated */
// export interface __OLD__BasePointerEvent extends BaseInputEvent {
//   source: 'pointer';
//   pointerId: number;
//   position: Point;
//   pressure: number;
//   button?: number;
//   pointerType: 'mouse' | 'touch' | 'pen';
// }

// // Keyboard events
// /** @deprecated */
// export interface KeyboardInputEvent extends BaseInputEvent {
//   source: 'keyboard';
//   name: 'press';
//   key: string;
//   code: string;
// }

// // Wheel events
// /** @deprecated */
// export interface WheelInputEvent extends BaseInputEvent {
//   source: 'wheel';
//   name: 'wheel';
//   position: Coordinate;
//   delta: Coordinate;
// }

// // Gesture events - multi-touch *only* gestures
// /** @deprecated */
// export interface GestureInputEvent extends BaseInputEvent {
//   source: 'gesture';
//   name: 'pinch' | 'rotate' | 'swipe' | 'pan';
//   center: Coordinate;
//   pointers: BasePointerEvent[];
//   scale?: number;
//   rotation?: number;
//   velocity?: Coordinate;
// }

// // Specific pointer event types
// /** @deprecated */
// export interface RotateEvent extends BasePointerEvent {
//   name: 'rotate';
//   data: {
//     mouse: Coordinate;
//     handle: Coordinate;
//     center: Coordinate;
//   };
// }

// /** @deprecated */
// export interface ResizeEvent extends BasePointerEvent {
//   name: 'resize';
//   data: {
//     handlePosition: ResizeHandlePosition;
//     // initialRect: Rect;
//     // currentRect: Rect;
//   };
// }

// /** @deprecated */
// export interface ConnectionEvent extends BasePointerEvent {
//   name: 'connection';
// }

// /** @deprecated */
// export interface SelectEvent extends BasePointerEvent {
//   name: 'select';
// }

// /** @deprecated */
// export interface DragEvent extends BasePointerEvent {
//   name: 'drag';
//   data: {
//     startPosition: Coordinate;
//     deltaPosition: Coordinate;
//   };
// }

// /** @deprecated */
// export interface PanEvent extends BasePointerEvent {
//   name: 'pan';
//   data: {
//     startPosition: Coordinate;
//     deltaPosition: Coordinate;
//   };
// }

// /** @deprecated */
// export type PointerInputEvent =
//   | RotateEvent
//   | ResizeEvent
//   | DragEvent
//   | PanEvent
//   | BasePointerEvent
//   | ConnectionEvent
//   | SelectEvent;

// /** @deprecated */
// export type __OLD__InputEvent = KeyboardInputEvent | PointerInputEvent | WheelInputEvent | GestureInputEvent;

// /** @deprecated */
// export type EventByName<T extends EventType> = Extract<__OLD__InputEvent, { name: T }>;
