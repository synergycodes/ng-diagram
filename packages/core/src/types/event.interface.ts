import { Edge } from './edge.interface';
import { Node } from './node.interface';

/**
 * Type for event target
 */
export type EventTarget = { type: 'node'; element: Node } | { type: 'edge'; element: Edge } | { type: 'diagram' };

/**
 * Base interface for all events
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  target: EventTarget;
}

/**
 * Keyboard base event interface
 */
export interface KeyboardBaseEvent extends BaseEvent {
  key: string;
  code: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

/**
 * Keyboard down event interface
 */
export interface KeyboardDownEvent extends KeyboardBaseEvent {
  type: 'keydown';
}

/**
 * Keyboard up event interface
 */
export interface KeyboardUpEvent extends KeyboardBaseEvent {
  type: 'keyup';
}

/**
 * Keyboard press event interface
 */
export interface KeyboardPressEvent extends KeyboardBaseEvent {
  type: 'keypress';
}

/**
 * Keyboard event interface
 */
export type KeyboardEvent = KeyboardDownEvent | KeyboardUpEvent | KeyboardPressEvent;

/**
 * Pointer base event interface
 */
export interface PointerBaseEvent extends BaseEvent {
  pointerId: number;
  x: number;
  y: number;
  pressure: number;
}

/**
 * Pointer event interface
 */
export interface PointerDownEvent extends PointerBaseEvent {
  type: 'pointerdown';
  button: number;
}

/**
 * Pointer up event interface
 */
export interface PointerUpEvent extends PointerBaseEvent {
  type: 'pointerup';
  button: number;
}

/**
 * Pointer move event interface
 */
export interface PointerMoveEvent extends PointerBaseEvent {
  type: 'pointermove';
}

/**
 * Pointer enter event interface
 */
export interface PointerEnterEvent extends PointerBaseEvent {
  type: 'pointerenter';
}

/**
 * Pointer leave event interface
 */
export interface PointerLeaveEvent extends PointerBaseEvent {
  type: 'pointerleave';
}

/**
 * Pointer event interface
 */
export type PointerEvent = PointerDownEvent | PointerUpEvent | PointerMoveEvent | PointerEnterEvent | PointerLeaveEvent;

/**
 * Resize event interface
 */
export interface ResizeEvent extends BaseEvent {
  type: 'resize';
  width: number;
  height: number;
  disableAutoSize?: boolean;
}

/**
 * Wheel event interface
 */
export interface WheelEvent extends BaseEvent {
  type: 'wheel';
  y: number;
  x: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
}

/**
 * Union type of all possible events
 */
export type Event = KeyboardEvent | PointerEvent | ResizeEvent | WheelEvent;
