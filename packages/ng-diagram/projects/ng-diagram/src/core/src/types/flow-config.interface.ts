import { EdgeRoutingName } from '../edge-routing-manager';
import type { Edge } from './edge.interface';
import type { Node, Port } from './node.interface';
import { Point, Size } from './utils';

/**
 * Configuration for node resizing behavior.
 *
 * @category Types
 */
export interface ResizeConfig {
  /**
   * Returns the minimum allowed size for a node.
   * @param node The node to compute the minimum size for.
   * @default { width: 20, height: 20 }
   */
  getMinNodeSize: (node: Node) => Size;

  /**
   * Allows resizing a group node smaller than its children bounds.
   * When set to false, a group node cannot be resized smaller than the bounding box of its children.
   * By default a group can be resized below children size.
   * @default true
   */
  allowResizeBelowChildrenBounds: boolean;

  /**
   * The default resizable state for nodes.
   * @default true
   */
  defaultResizable: boolean;
}

/**
 * Configuration for linking (edge creation) behavior.
 *
 * @category Types
 */
export interface LinkingConfig {
  /**
   * The maximum distance (in pixels) at temporary edge will snap to target port.
   * @default 10
   */
  portSnapDistance: number;
  /**
   * Validates whether a connection between two nodes and ports is allowed.
   * @param source The source node.
   * @param sourcePort The source port.
   * @param target The target node.
   * @param targetPort The target port.
   * @returns True if the connection is valid, false otherwise.
   * @default true
   */
  validateConnection: (
    source: Node | null,
    sourcePort: Port | null,
    target: Node | null,
    targetPort: Port | null
  ) => boolean;
  /**
   * Allows customization of the temporary edge object shown while the user is dragging to create a new edge.
   * Receives the default temporary edge (with source/target node/port IDs and positions)
   * and should return a fully-formed Edge object for rendering the temporary edge.
   * @param defaultTemporaryEdgeData The default temporary edge data (may be incomplete).
   * @returns The Edge object to use for the temporary edge.
   * @default returns Edge
   */
  temporaryEdgeDataBuilder: (defaultTemporaryEdgeData: Edge) => Edge;
  /**
   * Allows customization of the final edge object when the user completes edge creation.
   * Receives the default finalized edge (with source/target node/port IDs)
   * and should return a fully-formed Edge object to be added to the flow.
   * @param defaultFinalEdgeData The default finalized edge data (may be incomplete).
   * @returns The Edge object to use for the finalized edge.
   * @default returns Edge
   */
  finalEdgeDataBuilder: (defaultFinalEdgeData: Edge) => Edge;
}

/**
 * Configuration for node grouping behavior.
 *
 * @category Types
 */
export interface GroupingConfig {
  /**
   * Determines if a node can be grouped into a group node.
   * @param node The node to group.
   * @param group The group node.
   * @returns True if the node can be grouped, false otherwise.
   * @default true
   */
  canGroup: (node: Node, group: Node) => boolean;
}

/**
 * Configuration for zoom-to-fit behavior.
 *
 * @category Types
 */
export interface ZoomToFitConfig {
  /**
   * The default padding (in pixels) to use for zoom-to-fit operations.
   * Supports CSS-like padding syntax:
   * - Single number: applies to all sides
   * - [v, h]: vertical, horizontal
   * - [t, h, b]: top, horizontal, bottom
   * - [t, r, b, l]: top, right, bottom, left
   * Can be overridden per command invocation.
   * @default 50
   */
  padding: number | [number, number] | [number, number, number] | [number, number, number, number];
  /**
   * Whether to automatically zoom to fit all content when the diagram is initialized.
   * @default false
   */
  onInit: boolean;
}

/**
 * Configuration for zooming behavior.
 *
 * @category Types
 */
export interface ZoomConfig {
  /**
   * The minimum allowed zoom level.
   * @default 0.1
   */
  min: number;
  /**
   * The maximum allowed zoom level.
   * @default 10.0
   */
  max: number;
  /**
   * The zoom step increment.
   * @default 0.05
   */
  step: number;

  /**
   * Configuration for zoom-to-fit operations.
   */
  zoomToFit: ZoomToFitConfig;
}

/**
 * Configuration for the diagram background.
 *
 * @category Types
 */
export interface BackgroundConfig {
  /**
   * The size of the dots pattern.
   * @default 60
   */
  dotSize?: number;
  /**
   * The size of the smallest grid cell (minor grid spacing).
   * Supports rectangular grids by specifying different x and y values.
   * @default { x: 10, y: 10 }
   */
  gridSize?: Point;
  /**
   * Specifies how often major grid lines occur, measured in counts of minor grid cells.
   * E.g., { x: 5, y: 5 } draws a major vertical line every 5 minor columns and
   * a major horizontal line every 5 minor rows.
   * @default { x: 5, y: 5 }
   */
  majorLinesFrequency?: { x: number; y: number };
}

/**
 * Configuration for node rotation behavior.
 *
 * @category Types
 */
export interface NodeRotationConfig {
  /**
   * Determines if rotation snapping should be enabled for a node.
   * @param node The node to check for rotation snapping.
   * @returns True if rotation should snap, false otherwise.
   * @default true
   */
  shouldSnapForNode: (node: Node) => boolean;
  /**
   * Computes the snap angle for a node's rotation.
   * @param node The node to compute the snap angle for.
   * @returns The angle in degrees to snap to, or null if default snapping should be used.
   * @default null
   */
  computeSnapAngleForNode: (node: Node) => number | null;
  /**
   * The default snap angle in degrees. Used if computeSnapAngleForNode returns null.
   * @default 30
   */
  defaultSnapAngle: number;

  /**
   * The default rotatable state for nodes.
   * @default true
   */
  defaultRotatable: boolean;
}

/**
 * Configuration for node dragging behavior.
 *
 * @category Types
 */
export interface SnappingConfig {
  /**
   * Determines if a node should snap to grid while dragging.
   * @param node The node being dragged.
   * @returns True if the node should snap to grid, false otherwise.
   * @default false
   */
  shouldSnapDragForNode: (node: Node) => boolean;

  /**
   * Determines if a node should snap to grid while resizing.
   * @param node The node being resized.
   * @returns True if the node should snap to grid, false otherwise.
   * @default true
   */
  shouldSnapResizeForNode: (node: Node) => boolean;

  /**
   * Computes the snap point for a node while dragging. If null is returned, a default snap point will be used.
   * @param node The node to compute the snap point for dragging.
   * @returns The snap point for the node while dragging, or null.
   * @default null
   */
  computeSnapForNodeDrag: (node: Node) => Point | null;

  /**
   * Computes the snap point for a node while resizing. If null is returned, a default snap point will be used.
   * @param node The node to compute the snap point for resizing.
   * @returns The snap point for the node while resizing, or null.
   * @default null
   */
  computeSnapForNodeSize: (node: Node) => Point | null;

  /**
   * The default snap point for node dragging.
   * @default { x: 10, y: 10 }
   */
  defaultDragSnap: Point;

  /**
   * The default snap point for node resizing.
   * @default { x: 10, y: 10 }
   */
  defaultResizeSnap: Point;
}

/**
 * Configuration for selection moving behavior.
 *
 * @category Types
 */
export interface SelectionMovingConfig {
  /**
   * Distance in pixels to move the screen while dragging nodes near the edge of the viewport.
   * @default 15
   */
  edgePanningForce: number;
  /**
   * The threshold in pixels for edge panning to start.
   * If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.
   * @default 10
   */
  edgePanningThreshold: number;
}

/**
 * Configuration for z-index layering behavior.
 *
 * @category Types
 */
export interface ZIndexConfig {
  /**
   * Whether z-index middleware is enabled.
   * @default true
   */
  enabled: boolean;
  /**
   * The z-index value for selected elements.
   * @default 1000
   */
  selectedZIndex: number;
  /**
   * The z-index value for temporary edge.
   * @default 1000
   */
  temporaryEdgeZIndex: number;
  /**
   * Whether edges should appear above their connected nodes.
   * @default false
   */
  edgesAboveConnectedNodes: boolean;
  /**
   * Whether selected elements should be elevated to selectedZIndex.
   * @default true
   */
  elevateOnSelection: boolean;
}

/**
 * Configuration for edge routing behavior.
 *
 * @category Types
 */
export interface EdgeRoutingConfig {
  /**
   * The default edge routing algorithm to use for edges.
   * Can be one of the built-in routing names or a custom string for user-defined routing.
   * @see EdgeRoutingName
   * @default 'polyline'
   */
  defaultRouting: EdgeRoutingName;
  /** configuration options for bezier routing
   * @default { bezierControlOffset: 100 }
   */
  bezier?: {
    /** bezier control point offset
     * @default 100
     */
    bezierControlOffset?: number;
  };
  /** configuration options for orthogonal routing
   * @default { maxCornerRadius: 15, firstLastSegmentLength: 20 }
   */
  orthogonal?: {
    /** first/last segment length
     * @default 20
     */
    firstLastSegmentLength?: number;
    /** maximum corner radius
     * @default 15
     */
    maxCornerRadius?: number;
  };

  /**
   * Allow custom edge routing configurations.
   */
  [edgeRoutingName: string]: Record<string, unknown> | EdgeRoutingName | undefined;
}

/**
 * Configuration for box selection behavior.
 *
 * @category Types
 */
export interface BoxSelectionConfig {
  /**
   * Whether to select nodes that are only partially within the selection box.
   * @default true
   */
  partialInclusion?: boolean;

  /**
   * Whether to select nodes in real-time as the selection box is being drawn.
   * If false, nodes will only be selected when the box selection ends.
   * @default true
   */
  realtime?: boolean;
}

/**
 * The main configuration interface for the flow system.
 *
 * This type defines all available configuration options for the diagram engine.
 *
 * For most use cases, you should use {@link NgDiagramConfig}, which allows you to override only the properties you need.
 *
 * @category Types
 */
export interface FlowConfig {
  /**
   * Computes a unique ID for a node.
   * @returns The node's unique ID.
   */
  computeNodeId: () => string;

  /**
   * Computes a unique ID for an edge.
   * @returns The edge's unique ID.
   */
  computeEdgeId: () => string;

  /**
   * Configuration for node resizing.
   */
  resize: ResizeConfig;

  /**
   * Configuration for linking (edge creation).
   */
  linking: LinkingConfig;

  /**
   * Configuration for node grouping.
   */
  grouping: GroupingConfig;

  /**
   * Configuration for zooming.
   */
  zoom: ZoomConfig;

  /**
   * Configuration for edge routing.
   */
  edgeRouting: EdgeRoutingConfig;

  /**
   * Configuration for background behavior.
   */
  background: BackgroundConfig;

  /**
   * Configuration for node rotation behavior.
   */
  nodeRotation: NodeRotationConfig;

  /**
   * Configuration for snapping behavior.
   */
  snapping: SnappingConfig;

  /**
   * Configuration for selection moving behavior.
   */
  selectionMoving: SelectionMovingConfig;

  /**
   * Configuration for z-index layering behavior.
   */
  zIndex: ZIndexConfig;

  /**
   * Configuration for box selection behavior.
   */
  boxSelection: BoxSelectionConfig;

  /**
   * Enables or disables debug mode for the diagram.
   * When enabled, additional console logs are printed.
   * @default false
   */
  debugMode: boolean;
}
