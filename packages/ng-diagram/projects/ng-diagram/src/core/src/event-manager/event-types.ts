import type { Edge, GroupNode, Node, Point, Size, Viewport } from '../types';

/**
 * Map of all available diagram events and their payload types
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface DiagramEventMap {
  /**
   * Event emitted when the diagram initialization is complete.
   *
   * This event fires after all nodes and edges including their internal parts
   * (ports, labels) have been measured and positioned.
   */
  diagramInit: DiagramInitEvent;
  /**
   * Event emitted when selected nodes are moved within the diagram.
   *
   * This event fires when the user moves nodes manually by dragging or
   * programmatically using the diagram node service.
   */
  selectionMoved: SelectionMovedEvent;
  /**
   * Event emitted when the selection state changes in the diagram.
   *
   * This event fires when the user selects or deselects nodes and edges through
   * clicking or programmatically using the diagram selection service.
   */
  selectionChanged: SelectionChangedEvent;
  /**
   * Event emitted when selected elements are deleted from the diagram.
   *
   * This event fires when the user deletes nodes and edges using the delete key,
   * or programmatically through the diagram service.
   */
  selectionRemoved: SelectionRemovedEvent;
  /**
   * Event emitted when nodes are grouped or ungrouped.
   *
   * This event fires when the user moves nodes in or out of a group node,
   * changing their group membership status.
   */
  groupMembershipChanged: GroupMembershipChangedEvent;
  /**
   * Event emitted when a node is rotated in the diagram.
   *
   * This event fires when the user rotates a node manually using the rotation handle
   * or programmatically using the diagram node service.
   */
  selectionRotated: SelectionRotatedEvent;
  /**
   * Event emitted when the viewport changes through panning or zooming.
   *
   * This event fires during pan and zoom operations, including mouse wheel zoom,
   * and programmatic viewport changes.
   */
  viewportChanged: ViewportChangedEvent;
  /**
   * Event emitted when a user manually draws an edge between two nodes.
   *
   * This event only fires for user-initiated edge creation through the UI,
   * but not for programmatically added edges.
   */
  edgeDrawn: EdgeDrawnEvent;
  /**
   * Event emitted when clipboard content is pasted into the diagram.
   *
   * This event fires when nodes and edges are added via paste operations,
   * either through keyboard shortcuts or programmatic paste commands.
   */
  clipboardPasted: ClipboardPastedEvent;
  /**
   * Event emitted when a node or group size changes.
   *
   * This event fires when a node is resized manually by dragging resize handles
   * or programmatically using resize methods.
   */
  nodeResized: NodeResizedEvent;
  /**
   * Event emitted when a palette item is dropped onto the diagram.
   *
   * This event fires when users drag items from the palette and drop them
   * onto the canvas to create new nodes.
   */
  paletteItemDropped: PaletteItemDroppedEvent;
}

/**
 * Event payload emitted when the diagram initialization is complete.
 *
 * This event fires after all nodes and edges including their internal parts
 * (ports, labels) have been measured and positioned.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
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
 *
 * This event fires when the user moves nodes manually by dragging or programmatically
 * using the {@link NgDiagramNodeService.moveNodesBy} method.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface SelectionMovedEvent {
  /** Nodes that were moved with their updated positions */
  nodes: Node[];
}

/**
 * Event payload emitted when the selection state changes in the diagram.
 *
 * This event fires when the user selects or deselects nodes and edges through clicking
 * or programmatically using the {@link NgDiagramSelectionService}.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
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
 *
 * This event fires during pan and zoom operations, including mouse wheel zoom,
 * and programmatic viewport changes.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface ViewportChangedEvent {
  /** Current viewport state after the change */
  viewport: Viewport;
  /** Previous viewport state before the change */
  previousViewport: Viewport;
}

/**
 * Event payload emitted when a user manually draws an edge between two nodes.
 *
 * This event only fires for user-initiated edge creation through the UI,
 * but not for programmatically added edges.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
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
 *
 * This event fires when nodes and edges are added via paste operations,
 * either through keyboard shortcuts or programmatic paste commands.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface ClipboardPastedEvent {
  /** Nodes that were pasted into the diagram */
  nodes: Node[];
  /** Edges that were pasted into the diagram */
  edges: Edge[];
}

/**
 * Event payload emitted when a node or group size changes.
 *
 * This event fires when a node is resized manually by dragging resize handles
 * or programmatically using resize methods.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface NodeResizedEvent {
  /** Node that was resized with its updated size */
  node: Node;
  /** Previous size of the node before the change */
  previousSize: Size;
}

/**
 * Event payload emitted when a palette item is dropped onto the diagram.
 *
 * This event fires when users drag items from the palette and drop them
 * onto the canvas to create new nodes.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface PaletteItemDroppedEvent {
  /** The node that was created from the dropped palette item */
  node: Node;
  /** The position where the item was dropped */
  dropPosition: Point;
}

/**
 * Event payload emitted when selected elements are deleted from the diagram.
 *
 * This event fires when the user deletes nodes and edges using the delete key,
 * or programmatically through the diagram service.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface SelectionRemovedEvent {
  /** Nodes that were deleted from the diagram */
  deletedNodes: Node[];
  /** Edges that were deleted from the diagram */
  deletedEdges: Edge[];
}

/**
 * Event payload emitted when nodes are grouped or ungrouped.
 *
 * This event fires when the user moves nodes in or out of a group node,
 * changing their group membership status.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
 */
export interface GroupMembershipChangedEvent {
  /** Nodes added to groups, organized by target group */
  grouped: { nodes: Node[]; targetGroup: GroupNode }[];
  /** Nodes removed from groups */
  ungrouped: Node[];
}

/**
 * Event payload emitted when a node is rotated in the diagram.
 *
 * This event fires when the user rotates a node manually using the rotation handle
 * or programmatically using the {@link NgDiagramNodeService} rotation methods.
 *
 * @public
 * @since 0.8.0
 * @category Types/Events
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
