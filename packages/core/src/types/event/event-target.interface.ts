import { Edge, EdgeLabel } from '../edge.interface';
import { Node, Port } from '../node.interface';

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
