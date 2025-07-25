import type { Edge } from './edge.interface';
import type { Node, Port } from './node.interface';
import { Size } from './utils';

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
  canGroup: (nodes: Node, group: Node) => boolean;
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
 * The main configuration interface for the flow system.
 */
export interface FlowConfig {
  /**
   * Computes a unique ID for a node.
   * @param node The node to compute the ID for.
   * @returns The node's unique ID.
   */
  computeNodeId: (node: Node & { id?: string }) => string;
  /**
   * Computes a unique ID for an edge.
   * @param edge The edge to compute the ID for.
   * @returns The edge's unique ID.
   */
  computeEdgeId: (edge: Edge & { id?: string }) => string;
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
}
