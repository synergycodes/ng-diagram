import type { Edge, Node, Point, Size, Viewport } from '../types';

/**
 * Map of all available diagram events and their payload types
 *
 * @category Types
 */
export interface DiagramEventMap {
  /** Event emitted when the diagram is initialized */
  diagramInit: DiagramInitEvent;
  /** Event emitted when the selection is moved */
  selectionMoved: SelectionMovedEvent;
  /** Event emitted when the selection changes */
  selectionChanged: SelectionChangedEvent;
  /** Event emitted when the viewport changes */
  viewportChanged: ViewportChangedEvent;
  /** Event emitted when an edge is drawn */
  edgeDrawn: EdgeDrawnEvent;
  /** Event emitted when clipboard content is pasted */
  clipboardPasted: ClipboardPastedEvent;
  /** Event emitted when node or group size changes */
  nodeResized: NodeResizedEvent;
  /** Event emitted when a palette item is dropped */
  paletteItemDropped: PaletteItemDroppedEvent;
}

/**
 * Event payload emitted when the diagram initialization is complete.
 * This event fires after all nodes and edges including their internal parts have been measured and positioned.
 * @category Types
 */
export interface DiagramInitEvent {
  /** All nodes present in the diagram after initialization */
  nodes: Node[];
  /** All edges present in the diagram after initialization */
  edges: Edge[];
  /** Current viewport configuration including position and scale */
  viewport: Viewport;
}

/**
 * Event payload emitted when selected nodes are moved within the diagram.
 * This event fires when the user moves nodes manually by dragging or programmatically
 * using the `NgDiagramNodeService` `moveNodesBy` method.
 * @category Types
 */
export interface SelectionMovedEvent {
  /** Nodes that were moved with their updated positions */
  nodes: Node[];
}

/**
 * Event payload emitted when the selection state changes in the diagram.
 * This event fires when the user selects or deselects nodes and edges through clicking
 * or programmatically using the `NgDiagramSelectionService`.
 * @category Types
 */
export interface SelectionChangedEvent {
  /** Currently selected nodes */
  selectedNodes: Node[];
  /** Currently selected edges */
  selectedEdges: Edge[];
  /** Previously selected nodes before the change */
  previousNodes: Node[];
  /** Previously selected edges before the change */
  previousEdges: Edge[];
}

/**
 * Event payload emitted when the viewport changes through panning or zooming.
 * This event fires during pan and zoom operations, including mouse wheel zoom,
 * pinch zoom, and programmatic viewport changes.
 * @category Types
 */
export interface ViewportChangedEvent {
  /** Current viewport state after the change */
  viewport: Viewport;
  /** Previous viewport state before the change */
  previousViewport: Viewport;
}

/**
 * Event payload emitted when a user manually draws an edge between two nodes.
 * This event only fires for user-initiated edge creation through the UI,
 * not for programmatically added edges.
 * @category Types
 */
export interface EdgeDrawnEvent {
  /** The newly created edge object */
  edge: Edge;
  /** The source node from which the edge originates */
  source: Node;
  /** The target node to which the edge connects */
  target: Node;
  /** Source port identifier if connected to a specific port */
  sourcePort?: string;
  /** Target port identifier if connected to a specific port */
  targetPort?: string;
}

/**
 * Event payload emitted when clipboard content is pasted into the diagram.
 * This event fires when nodes and edges are added via paste operations
 * @category Types
 */
export interface ClipboardPastedEvent {
  /** Edges that were pasted into the diagram */
  edges: Edge[];
  /** Nodes that were pasted into the diagram */
  nodes: Node[];
}

/**
 * Event payload emitted when node or group size changes.
 * This event fires when node was resized manually by dragging resize handles
 * or programmatically using resize methods.
 * @category Types
 */
export interface NodeResizedEvent {
  /** Node that was resized with their updated sizes */
  node: Node;
  /** Previous size of the node before the change */
  previousSize: Size;
}

/**
 * Event payload emitted when a palette item is dropped onto the diagram.
 * This event fires when users drag items from the palette and drop them to create new nodes.
 * @category Types
 */
export interface PaletteItemDroppedEvent {
  /** The node that was created from the dropped palette item */
  node: Node;
  /** The position where the item was dropped */
  dropPosition: Point;
}

/**
 * Type for event listeners
 */
export type EventListener<T> = (event: T) => void;

/**
 * Type for event unsubscribe function
 */
export type UnsubscribeFn = () => void;
