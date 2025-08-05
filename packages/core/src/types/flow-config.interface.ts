import type { Edge } from './edge.interface';
import type { Node, Port } from './node.interface';
import { LayoutAlignmentType, LayoutAngleType } from './tree-layout.interface';
import { Point, Size } from './utils';

/**
 * Configuration for node resizing behavior.
 */
export interface ResizeConfig {
  /**
   * Returns the minimum allowed size for a node.
   * @param node The node to compute the minimum size for.
   */
  getMinNodeSize: (node: Node) => Size;
}

/**
 * Configuration for linking (edge creation) behavior.
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
 * Configuration for node rotation behavior.
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
}

/**
 * Configuration for node dragging behavior.
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
 * Configuration for tree layout behavior.
 */
export interface TreeLayoutConfig {
  /**
   * Gets the layout angle for positioning a node in a tree structure.
   * @param node The node to get the layout angle for.
   * @returns The angle in degrees for the node's position in the tree, or null for default positioning.
   */
  getLayoutAngleForNode: (node: Node) => LayoutAngleType | null;
  /**
   * Gets the layout alignment for a node in a tree structure.
   * @param node The node to get the alignment for.
   * @returns The alignment type for the node, or null for default alignment.
   */
  getLayoutAlignmentForNode: (node: Node) => LayoutAlignmentType | null;
}

/**
 * The main configuration interface for the flow system.
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

  treeLayout: TreeLayoutConfig;
  nodeRotation: NodeRotationConfig;
  snapping: SnappingConfig;
}
