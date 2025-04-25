import { Edge } from './edge.interface';
import { Node } from './node.interface';

/**
 * Type for event target
 */
export type EventTarget = Node | Edge | null;

/**
 * Base interface for all events
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  target: EventTarget;
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
}

/**
 * Union type of all possible events
 */
export type Event = KeyboardEvent | PointerEvent;
