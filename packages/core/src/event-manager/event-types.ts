import type { Edge, Node, Viewport } from '../types';

/**
 * Map of all available diagram events and their payload types
 */
export interface DiagramEventMap {
  diagramInit: DiagramInitEvent;
  selectionMoved: SelectionMovedEvent;
  selectionChanged: SelectionChangedEvent;
  viewportChanged: ViewportChangedEvent;
  edgeDrawn: EdgeDrawnEvent;
}

/**
 * Event emitted when the diagram is initialized
 */
export interface DiagramInitEvent {
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
}

/**
 * Event emitted when selected objects are moved
 */
export interface SelectionMovedEvent {
  nodes: Node[];
}

/**
 * Event emitted when selection changes
 */
export interface SelectionChangedEvent {
  selectedNodes: Node[];
  selectedEdges: Edge[];
  previousNodes: Node[];
  previousEdges: Edge[];
}

/**
 * Event emitted when viewport changes
 */
export interface ViewportChangedEvent {
  viewport: Viewport;
  previousViewport: Viewport;
}

/**
 * Event emitted when a connection is completed
 */
export interface EdgeDrawnEvent {
  edge: Edge;
  source: Node;
  target: Node;
  sourcePort?: string;
  targetPort?: string;
}

/**
 * Type for event listeners
 */
export type EventListener<T> = (event: T) => void;

/**
 * Type for event unsubscribe function
 */
export type UnsubscribeFn = () => void;
