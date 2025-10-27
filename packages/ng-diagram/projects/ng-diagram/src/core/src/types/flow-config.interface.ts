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
   */
  getMinNodeSize: (node: Node) => Size;

  /**
   * Allows resizing a group node smaller than its children bounds.
   * When set to false, a group node cannot be resized smaller than the bounding box of its children.
   * Default: true (group can be resized below children size).
   */
  allowResizeBelowChildrenBounds: boolean;

  /**
   * The default resizable state for nodes.
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
   */
  portSnapDistance: number;
  /**
   * Validates whether a connection between two nodes and ports is allowed.
   * @param source The source node.
   * @param sourcePort The source port.
   * @param target The target node.
   * @param targetPort The target port.
   * @returns True if the connection is valid, false otherwise.
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
   */
  temporaryEdgeDataBuilder: (defaultTemporaryEdgeData: Edge) => Edge;
  /**
   * Allows customization of the final edge object when the user completes edge creation.
   * Receives the default finalized edge (with source/target node/port IDs)
   * and should return a fully-formed Edge object to be added to the flow.
   * @param defaultFinalEdgeData The default finalized edge data (may be incomplete).
   * @returns The Edge object to use for the finalized edge.
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
   */
  canGroup: (node: Node, group: Node) => boolean;
}

/**
 * Configuration for zooming behavior.
 *
 * @category Types
 */
export interface ZoomConfig {
  /**
   * The minimum allowed zoom level.
   */
  min: number;
  /**
   * The maximum allowed zoom level.
   */
  max: number;
  /**
   * The zoom step increment.
   */
  step: number;
}

/**
 * Configuration for the diagram background.
 *
 * @category Types
 */
export interface BackgroundConfig {
  /**
   * The size of the dots in the background.
   */
  dotSize: number;
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
   */
  shouldSnapForNode: (node: Node) => boolean;
  /**
   * Computes the snap angle for a node's rotation.
   * @param node The node to compute the snap angle for.
   * @returns The angle in degrees to snap to, or null if default snapping should be used.
   */
  computeSnapAngleForNode: (node: Node) => number | null;
  /**
   * The default snap angle in degrees. Used if computeSnapAngleForNode returns null.
   * @default 15
   */
  defaultSnapAngle: number;

  /**
   * The default rotatable state for nodes.
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
   */
  shouldSnapDragForNode: (node: Node) => boolean;

  /**
   * Determines if a node should snap to grid while resizing.
   * @param node The node being resized.
   * @returns True if the node should snap to grid, false otherwise.
   */
  shouldSnapResizeForNode: (node: Node) => boolean;

  /**
   * Computes the snap point for a node while dragging. If null is returned, a default snap point will be used.
   * @param node The node to compute the snap point for dragging.
   * @returns The snap point for the node while dragging, or null.
   */
  computeSnapForNodeDrag: (node: Node) => Point | null;

  /**
   * Computes the snap point for a node while resizing. If null is returned, a default snap point will be used.
   * @param node The node to compute the snap point for resizing.
   * @returns The snap point for the node while resizing, or null.
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
   */
  edgePanningForce: number;
  /**
   * The threshold in pixels for edge panning to start.
   * If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.
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
   */
  enabled: boolean;
  /**
   * The z-index value for selected elements.
   */
  selectedZIndex: number;
  /**
   * The z-index value for temporary edge.
   */
  temporaryEdgeZIndex: number;
  /**
   * Whether edges should appear above their connected nodes.
   */
  edgesAboveConnectedNodes: boolean;
  /**
   * Whether selected elements should be elevated to selectedZIndex.
   */
  elevateOnSelection: boolean;
}

/**
 * Interface representing configurable properties of the edge routing.
 *
 * @category Types
 */
export interface EdgeRoutingConfig {
  /**
   * The default edge routing algorithm to use for edges.
   * Can be one of the built-in routing names or a custom string for user-defined routing.
   * @see EdgeRoutingName
   */
  defaultRouting: EdgeRoutingName;
  /** configuration options for bezier routing */
  bezier?: {
    /** bezier control point offset */
    bezierControlOffset?: number;
  };
  /** configuration options for orthogonal routing */
  orthogonal?: {
    /** first/last segment length */
    firstLastSegmentLength?: number;
    /** maximum corner radius */
    maxCornerRadius?: number;
  };

  /**
   * Allow custom edge routing configurations.
   */
  [edgeRoutingName: string]: Record<string, unknown> | EdgeRoutingName | undefined;
}

/**
 * The main configuration interface for the flow system.
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
   * Enables or disables debug mode for the diagram.
   * When enabled, additional console logs are printed.
   */
  debugMode: boolean;
}
