import type { Edge, EdgeLabel } from './edge.interface';
import type { Node, Port } from './node.interface';
import { Point } from './utils';

/**
 * Type for node target
 */
export interface NodeTarget {
  type: 'node';
  element: Node;
}

/**
 * Type for edge target
 */
export interface EdgeTarget {
  type: 'edge';
  element: Edge;
}

/**
 * Type for port target
 */
export interface PortTarget {
  type: 'port';
  element: Port;
}

/**
 * Type for diagram target
 */
export interface DiagramTarget {
  type: 'diagram';
}

/**
 * Type for edge label target
 */
export interface EdgeLabelTarget {
  type: 'edge-label';
  element: EdgeLabel;
}

/**
 * Type for resize handle position
 */
export type ResizeHandlePosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

/**
 * Type for resize handle target
 */
export interface ResizeHandleTarget {
  type: 'resize-handle';
  position: ResizeHandlePosition;
  element: Node;
}

/**
 * Type for rotate handle target
 */
export interface RotateHandleTarget {
  type: 'rotate-handle';
  element: Node;
}

/**
 * Type for event target
 */
export type EventTarget =
  | NodeTarget
  | EdgeTarget
  | PortTarget
  | ResizeHandleTarget
  | RotateHandleTarget
  | DiagramTarget
  | EdgeLabelTarget;

/**
 * Base interface for all events
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  target: EventTarget;
  cursorPosition?: {
    x: number;
    y: number;
  };
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
  ctrlKey: boolean;
  metaKey: boolean;
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
 * Rotate event interface
 */
export interface RotateEvent extends BaseEvent {
  type: 'rotate';
  mouse: Point;
  handle: Point;
  center: Point;
}

/**
 * Union type of all possible events
 */
export type Event = KeyboardEvent | PointerEvent | WheelEvent | RotateEvent;
