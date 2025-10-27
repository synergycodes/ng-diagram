import type { Edge, GroupNode, Node, Point, Size, Viewport } from '../types';

/**
 * Map of all available diagram events and their payload types
 *
 * @category Types
 */
export interface DiagramEventMap {
  /**
   * Event emitted when the diagram is initialized
   * This event fires after all nodes and edges including their internal parts have been measured and positioned.
   */
  diagramInit: DiagramInitEvent;
  /**
   * Event emitted when the selection is moved
   * This event fires when the user moves nodes manually or programmatically
   */
  selectionMoved: SelectionMovedEvent;
  /**
   * Event emitted when the selection changes
   * This event fires when the user selects or deselects nodes and edges
   */
  selectionChanged: SelectionChangedEvent;
  /**
   * Event emitted when selected elements are deleted from the diagram
   * This event fires when the user deletes nodes and edges
   */
  selectionRemoved: SelectionRemovedEvent;
  /**
   * Event emitted when nodes are grouped into a group
   * This event fires when the user moves nodes in or out of a group node.
   */
  selectionGroupChanged: SelectionGroupChangedEvent;
  /**
   * Event emitted when a node is rotated
   * This event fires when the user rotates a node manually or programmatically
   */
  selectionRotated: SelectionRotatedEvent;
  /**
   * Event emitted when the viewport changes
   * This event fires during pan and zoom operations
   */
  viewportChanged: ViewportChangedEvent;
  /**
   * Event emitted when an edge is drawn
   * This event fires when the user draws an edge manually through the UI
   */
  edgeDrawn: EdgeDrawnEvent;
  /**
   * Event emitted when clipboard content is pasted
   * This event fires when nodes and edges are added via paste operations
   */
  clipboardPasted: ClipboardPastedEvent;
  /**
   * Event emitted when node or group size changes
   * This event fires when node was resized manually or programmatically
   */
  nodeResized: NodeResizedEvent;
  /**
   * Event emitted when a palette item is dropped
   * This event fires when users drag items from the palette and drop them to create new nodes
   */
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
 * also from temporary links creation, but not for programmatically added edges.
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
 * Event payload emitted when selected elements are deleted from the diagram.
 * This event fires when the user deletes nodes and edges using the delete key,
 * context menu, or programmatically through the diagram service.
 * @category Types
 */
export interface SelectionRemovedEvent {
  /** Nodes that were deleted from the diagram */
  deletedNodes: Node[];
  /** Edges that were deleted from the diagram */
  deletedEdges: Edge[];
}

/**
 * Event payload emitted when nodes are grouped or ungrouped by moving them into/out of a group.
 * This event fires when the user moves nodes in or out of a group node.
 * @category Types
 */
export interface SelectionGroupChangedEvent {
  /** Nodes that were operated on (either grouped or ungrouped) */
  nodes: Node[];
  /** The target group node that received the nodes */
  targetGroup?: GroupNode;
}

/**
 * Event payload emitted when a node is rotated in the diagram.
 * This event fires when the user rotates a node manually using the rotation handle
 * or programmatically using the `NgDiagramNodeService` rotation methods.
 * @category Types
 */
export interface SelectionRotatedEvent {
  /** The node that was rotated */
  node: Node;
  /** The new angle of the node in degrees */
  angle: number;
  /** The previous angle of the node in degrees */
  previousAngle: number;
}

/**
 * Type for event listeners
 */
export type EventListener<T> = (event: T) => void;

/**
 * Type for event unsubscribe function
 */
export type UnsubscribeFn = () => void;
