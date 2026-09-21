import { EdgeRoutingName } from '../edge-routing-manager';
import type { Edge, EdgeEnd } from './edge.interface';
import type { Node, Port } from './node.interface';
import type { NgDiagramPanelPosition } from './panel-position.interface';
import type { ShortcutDefinition } from './shortcut.interface';
import { Point, Size } from './utils';

/**
 * Configuration for node resizing behavior.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface ResizeConfig {
  /**
   * Returns the minimum allowed size for a node.
   * @param node The node to compute the minimum size for.
   * @default () => ({ width: 20, height: 20 })
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface LinkingConfig {
  /**
   * The maximum distance (in pixels) at temporary edge will snap to target port.
   * @default 10
   */
  portSnapDistance: number;
  /**
   * Validates whether a connection between two nodes and ports is allowed.
   *
   * Called for every operation that creates a connection: drawing a new edge,
   * relinking an endpoint of an existing edge, and `attachEdge`. The optional
   * `context` tells which operation is being validated (since 1.4.0).
   *
   * `source` is `null` for draws started with `startLinkingFromPosition`.
   * When an edge is relinked or attached, the other end of that edge can be
   * free (dangling); the `source` or `target` for that end is then `null`.
   *
   * @param source The source node, or `null` when the source end is free.
   * @param sourcePort The source port.
   * @param target The target node, or `null` when the target end is free.
   * @param targetPort The target port.
   * @param context The operation being validated (`draw` when omitted).
   * @returns True if the connection is valid, false otherwise.
   * @default () => true
   */
  validateConnection: (
    source: Node | null,
    sourcePort: Port | null,
    target: Node | null,
    targetPort: Port | null,
    context?: ConnectionValidationContext
  ) => boolean;
  /**
   * Allows customization of the temporary edge object shown while the user is dragging to create a new edge.
   * Receives the default temporary edge (with source/target node/port IDs and positions)
   * and should return a fully-formed Edge object for rendering the temporary edge.
   * @param defaultTemporaryEdgeData The default temporary edge data (may be incomplete).
   * @returns The Edge object to use for the temporary edge.
   * @default (edge) => Edge
   */
  temporaryEdgeDataBuilder: (defaultTemporaryEdgeData: Edge) => Edge;
  /**
   * Allows customization of the final edge object when the user completes edge creation.
   * Receives the default finalized edge (with source/target node/port IDs)
   * and should return a fully-formed Edge object to be added to the flow.
   * @param defaultFinalEdgeData The default finalized edge data (may be incomplete).
   * @returns The Edge object to use for the finalized edge.
   * @default (edge) => Edge
   */
  finalEdgeDataBuilder: (defaultFinalEdgeData: Edge) => Edge;
  /**
   * Enable edge panning when the routed edge is near the edge of the viewport.
   *
   * @default true
   */
  edgePanningEnabled: boolean;
  /**
   * Multiplier for edge panning speed while routing edge is near the edge of the viewport.
   *
   * @default 10
   */
  edgePanningForce: number;
  /**
   * The threshold in pixels for edge panning to start.
   * If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.
   *
   * @default 30
   */
  edgePanningThreshold: number;
  /**
   * Whether to select a node when the user presses a port to start linking.
   * When true (default), pressing a port also triggers node selection events.
   * When false, port press only initiates the linking gesture without selecting the node.
   *
   * @default true
   * @since 1.2.0
   */
  selectNodeOnPortPress: boolean;
  /**
   * Default `relinkable` value for edges that do not set their own. `true`
   * lets the user drag both ends of an edge to another port, `'source'` or
   * `'target'` allows only that end, and `false` allows neither. A selected
   * edge shows a handle at each end that can be relinked. Dragging a handle
   * previews the new connection and commits it on drop. A drop on empty
   * canvas detaches the endpoint when `danglingEdges.enabled` is true;
   * otherwise the relink is reverted.
   *
   * Relinking uses the same `portSnapDistance`, edge panning and
   * `temporaryEdgeDataBuilder` settings as edge drawing. Each drop is
   * validated with `validateConnection`, which receives a context with
   * `reason: 'relink'` and the edge being relinked.
   *
   * @default false
   * @since 1.4.0
   */
  defaultRelinkable: boolean | EdgeEnd;
}

/**
 * Configuration for dangling edges: edges with one or both endpoints not
 * connected to any node. A free endpoint has an empty `source` or `target`,
 * and its position is stored in `sourcePosition` or `targetPosition`.
 *
 * The feature is off by default: an edge dropped on empty canvas is
 * discarded, and deleting a node deletes its edges.
 *
 * @public
 * @since 1.4.0
 * @category Types/Configuration/Features
 */
export interface DanglingEdgesConfig {
  /**
   * Master switch for dangling edges. When true, an edge drawn onto empty
   * canvas is kept as a dangling edge instead of being discarded, and a
   * relink dropped on empty canvas detaches that endpoint. It also enables
   * `detachEdge` and `startLinkingFromPosition`.
   *
   * A drop on a port that the edge cannot connect to (for example a port
   * with the wrong direction) does not count as a drop on empty canvas. Such
   * a draw is discarded and such a relink is reverted.
   * @default false
   */
  enabled: boolean;
  /**
   * Decides per edge whether a draw or relink dropped on empty canvas keeps
   * the edge as a dangling edge. Called only when `enabled` is true. For a
   * draw, `edge` is the final edge, after `linking.finalEdgeDataBuilder` has
   * run. For a relink, `edge` is the edge as it would be after the detach.
   * Returning false discards the drawn edge or reverts the relink, which is
   * also what happens when the feature is off.
   * @param edge The edge that would be kept.
   * @param dropPosition The position where the pointer was released, in flow coordinates.
   * @default undefined (keep every edge)
   */
  shouldKeepOnDrop?: (edge: Edge, dropPosition: Point) => boolean;
  /**
   * When true, deleting a node keeps its edges as dangling edges instead of
   * deleting them. Each freed endpoint stays anchored where its port was.
   * Requires `enabled` to be true.
   *
   * An edge is still deleted, not detached, in these cases:
   * - The edge itself is part of the deleted selection. An explicit delete
   *   always wins.
   * - The edge is hidden only because of the node it loses, for example the
   *   edges of the collapsed children of a deleted group. Detaching it would
   *   turn invisible wiring into a visible dangling edge. An edge that is
   *   hidden for another reason (its own `hidden` flag, a template binding,
   *   or a hidden node at the other end) is detached like any other edge and
   *   stays hidden.
   * - The edge loses both endpoints in the same delete. It becomes a dual
   *   dangling edge only when {@link shouldDetachOnNodeDelete} is provided
   *   and returns true for both ends.
   * @default false
   */
  detachOnNodeDelete: boolean;
  /**
   * Decides per endpoint whether it is detached (kept as a free endpoint) or
   * deleted together with the node. Called only when `enabled` and
   * `detachOnNodeDelete` are true, once for each endpoint that loses its
   * node. Returning false deletes the edge. An edge that loses both
   * endpoints at once survives as a dual dangling edge only when this
   * callback is provided and returns true for both ends.
   * @param edge The edge that loses a node.
   * @param deletedNode The node being deleted.
   * @param end The endpoint of `edge` that is connected to `deletedNode`.
   * @default undefined (detach every edge, except edges losing both ends)
   */
  shouldDetachOnNodeDelete?: (edge: Edge, deletedNode: Node, end: EdgeEnd) => boolean;
}

/**
 * Context passed to {@link LinkingConfig.validateConnection}. It describes the
 * operation that is being validated.
 *
 * - `draw` — a new edge is being drawn, by a pointer gesture or by
 *   `startLinking` / `startLinkingFromPosition`.
 * - `relink` — an endpoint of `edge` is being dragged to a new target.
 * - `attach` — `NgDiagramModelService.attachEdge` connects an endpoint of `edge`.
 *
 * @public
 * @since 1.4.0
 * @category Types/Configuration/Features
 */
export interface ConnectionValidationContext {
  /** The operation being validated. */
  reason: 'draw' | 'relink' | 'attach';
  /** The existing edge whose endpoint is being connected (relink and attach only). */
  edge?: Edge;
  /** Which endpoint of `edge` is being connected (relink and attach only). */
  end?: EdgeEnd;
}

/**
 * Configuration for node grouping behavior.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface GroupingConfig {
  /**
   * Determines if a node can be grouped into a group node.
   * @param node The node to group.
   * @param group The group node.
   * @returns True if the node can be grouped, false otherwise.
   * @default () => true
   */
  canGroup: (node: Node, group: Node) => boolean;
}

/**
 * Configuration for zoom-to-fit behavior.
 *
 * @category Types/Configuration/Features
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface ZoomConfig {
  /**
   * The minimum allowed zoom level.
   * @default 0.01
   */
  min: number;
  /**
   * The maximum allowed zoom level.
   * @default 10.0
   */
  max: number;
  /**
   * The zoom step increment.
   * @default 0.03
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface BackgroundConfig {
  /**
   * Distance in pixels between consecutive dots in the background pattern.
   * @default 30
   */
  dotSpacing?: number;
  /**
   * The size of the smallest grid cell (minor grid spacing).
   * Supports rectangular grids by specifying different width and height values.
   * @default { width: 10, height: 10 }
   */
  cellSize?: Size;
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface NodeRotationConfig {
  /**
   * Determines if rotation snapping should be enabled for a node.
   * @param node The node to check for rotation snapping.
   * @returns True if rotation should snap, false otherwise.
   * @default () => false
   */
  shouldSnapForNode: (node: Node) => boolean;
  /**
   * Computes the snap angle for a node's rotation.
   * @param node The node to compute the snap angle for.
   * @returns The angle in degrees to snap to, or null if default snapping should be used.
   * @default () => null
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface SnappingConfig {
  /**
   * Determines if a node should snap to grid while dragging.
   * @param node The node being dragged.
   * @returns True if the node should snap to grid, false otherwise.
   * @default () => false
   */
  shouldSnapDragForNode: (node: Node) => boolean;

  /**
   * Determines if a node should snap to grid while resizing.
   * @param node The node being resized.
   * @returns True if the node should snap to grid, false otherwise.
   * @default () => false
   */
  shouldSnapResizeForNode: (node: Node) => boolean;

  /**
   * Computes the snap size for a node while dragging. If null is returned, a default snap size will be used.
   * If computeSnapForNodeDrag is used, it takes precedence over defaultDragSnap.
   * @param node The node to compute the snap size for dragging.
   * @returns The snap size for the node while dragging, or null.
   * @default () => null
   */
  computeSnapForNodeDrag: (node: Node) => Size | null;

  /**
   * Computes the snap size for a node while resizing. If null is returned, a default snap size will be used.
   * @param node The node to compute the snap size for resizing.
   * @returns The snap size for the node while resizing, or null.
   * @default () => null
   */
  computeSnapForNodeSize: (node: Node) => Size | null;

  /**
   * Computes the snap offset for a node while resizing. The snapped size follows the
   * sequence `offset + n * snap` per axis, so a node with a 60px header snapping every
   * 50px can snap to 60, 110, 160, ... instead of 50, 100, 150, ...
   * If null is returned, {@link defaultResizeSnapOffset} is used.
   * If computeSnapOffsetForNodeSize is used, it takes precedence over defaultResizeSnapOffset.
   * @param node The node to compute the snap offset for resizing.
   * @returns The snap offset for the node while resizing, or null.
   * @default () => null
   * @since 1.3.0
   */
  computeSnapOffsetForNodeSize: (node: Node) => Size | null;

  /**
   * The default snap size for node dragging.
   * If computeSnapForNodeDrag is used, it takes precedence over this value.
   * @default { width: 10, height: 10 }
   */
  defaultDragSnap: Size;

  /**
   * The default snap size for node resizing.
   * @default { width: 10, height: 10 }
   */
  defaultResizeSnap: Size;

  /**
   * The default snap offset for node resizing. The snapped size follows the
   * sequence `offset + n * snap` per axis (see {@link computeSnapOffsetForNodeSize}).
   * If computeSnapOffsetForNodeSize is used, it takes precedence over this value.
   * @default { width: 0, height: 0 }
   * @since 1.3.0
   */
  defaultResizeSnapOffset: Size;
}

/**
 * Configuration for selection moving behavior.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface SelectionMovingConfig {
  /**
   * Enable edge panning when the moved node is near the edge of the viewport.
   *
   * @default true
   */
  edgePanningEnabled: boolean;
  /**
   * Multiplier for edge panning speed while dragging nodes near the edge of the viewport.
   *
   * @default 10
   */
  edgePanningForce: number;
  /**
   * The threshold in pixels for edge panning to start.
   * If the mouse pointer is within this distance from the edge of the viewport, panning will be triggered.
   *
   * @default 30
   */
  edgePanningThreshold: number;
}

/**
 * Configuration for z-index layering behavior.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface ZIndexConfig {
  /**
   * Whether z-index middleware is enabled.
   * @default true
   */
  enabled: boolean;
  /**
   * The z-index value added to selected elements' computed z-index.
   * Applied cumulatively — a selected child inside a selected parent
   * receives this value twice (once from the parent's elevation, once from its own).
   * @default 10000
   */
  selectedZIndex: number;
  /**
   * The z-index value for temporary edge.
   * @default 2147483647
   */
  temporaryEdgeZIndex: number;
  /**
   * Whether edges should appear above their connected nodes.
   * @default false
   */
  edgesAboveConnectedNodes: boolean;
  /**
   * Whether selected elements should be elevated by adding `selectedZIndex` to their computed z-index.
   * @default true
   */
  elevateOnSelection: boolean;
}

/**
 * Configuration for edge routing behavior.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
 */
export interface EdgeRoutingConfig {
  /**
   * The default edge routing algorithm to use for edges.
   * Can be one of the built-in routing names or a custom string for user-defined routing.
   * @see EdgeRoutingName
   * @default 'orthogonal'
   */
  defaultRouting: EdgeRoutingName;
  /** configuration options for bezier routing
   */
  bezier?: {
    /** bezier control point offset
     * @default 100
     */
    bezierControlOffset?: number;
  };
  /** configuration options for orthogonal routing
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
 * @public
 * @since 0.8.0
 * @category Types/Configuration/Features
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
 * Configuration for viewport virtualization behavior.
 * When enabled, only nodes and edges visible in the viewport (plus padding) are rendered,
 * significantly improving performance for large diagrams.
 *
 * @public
 * @since 1.0.0
 * @category Types/Configuration/Features
 */
export interface VirtualizationConfig {
  /**
   * Whether viewport virtualization is enabled.
   * When disabled, all nodes/edges are rendered regardless of viewport.
   * @default false
   */
  enabled: boolean;

  /**
   * Padding multiplier relative to viewport size.
   * The actual padding is calculated as: max(viewportWidth, viewportHeight) * padding
   * For example, 0.5 means 50% of the viewport size as padding in each direction.
   * @default 0.5
   */
  padding: number;

  /**
   * Delay in milliseconds after panning stops before re-rendering visible nodes.
   * @default 100
   */
  idleDelay?: number;
}

/**
 * Configuration for the default Node Templates
 *
 * @public
 * @since 1.3.0
 * @category Types/Configuration/Features
 */
export interface DefaultNodeTemplateConfig {
  /**
   * When explicitly set to `true` this will remove the ports in the default Node Template
   * @default undefined;
   */
  removePorts: boolean;
}

/**
 * The main configuration interface for the flow system.
 *
 * This type defines all available configuration options for the diagram engine.
 *
 * For most use cases, you should use {@link NgDiagramConfig}, which allows you to override only the properties you need.
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration
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
   * Configuration for dangling edges (edges with unconnected endpoints).
   * @since 1.4.0
   */
  danglingEdges: DanglingEdgesConfig;

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
   * Configuration for viewport virtualization.
   * Improves performance for large diagrams by only rendering visible elements.
   */
  virtualization: VirtualizationConfig;

  /**
   * Configuration for keyboard shortcuts.
   */
  shortcuts: ShortcutDefinition[];

  /**
   * Enables or disables debug mode for the diagram.
   * When enabled, additional console logs are printed.
   * @default false
   */
  debugMode: boolean;

  /**
   * @since 0.9.0
   *
   * Hides the ngDiagram watermark when set to true.
   * @default undefined
   */
  hideWatermark?: boolean;

  /**
   * @since 1.2.0
   *
   * Sets the preferred position for the ngDiagram watermark.
   * If the chosen position collides with a registered panel (e.g., minimap),
   * the watermark shifts to the nearest available corner.
   * @default 'bottom-right'
   */
  watermarkPosition?: NgDiagramPanelPosition;

  /**
   * @since 0.9.0
   *
   * Enables or disables panning on the diagram.
   * When set to false, user is not able to move the viewport by panning.
   * @default true
   */
  viewportPanningEnabled: boolean;

  /**
   * @since 1.0.0
   *
   * Enables or disables node dragging on the diagram.
   * When set to false, users cannot move nodes via mouse dragging or keyboard arrow keys.
   * @default true
   */
  nodeDraggingEnabled: boolean;

  /**
   * @since 1.3.0
   * Configuration options for the default Node Templates
   */
  defaultNode?: DefaultNodeTemplateConfig;
}
