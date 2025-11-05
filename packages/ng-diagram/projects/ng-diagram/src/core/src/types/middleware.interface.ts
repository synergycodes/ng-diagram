import type { ActionStateManager } from '../action-state-manager/action-state-manager';
import type { EdgeRoutingManager } from '../edge-routing-manager';
import type { Edge } from './edge.interface';
import { EnvironmentInfo } from './environment.interface';
import { FlowConfig } from './flow-config.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Model action types that can trigger middleware execution.
 * These represent all possible operations that modify the diagram state.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'logger',
 *   execute: (context, next) => {
 *     console.log('Action type:', context.modelActionType);
 *     next();
 *   }
 * };
 * ```
 *
 * @category Types
 */
export type ModelActionType =
  | 'init'
  | 'changeSelection'
  | 'moveNodesBy'
  | 'deleteSelection'
  | 'addNodes'
  | 'updateNode'
  | 'updateNodes'
  | 'deleteNodes'
  | 'clearModel'
  | 'paletteDropNode'
  | 'addEdges'
  | 'updateEdge'
  | 'deleteEdges'
  | 'deleteElements'
  | 'paste'
  | 'moveViewport'
  | 'resizeNode'
  | 'startLinking'
  | 'moveTemporaryEdge'
  | 'finishLinking'
  | 'zoom'
  | 'changeZOrder'
  | 'rotateNodeTo'
  | 'highlightGroup'
  | 'highlightGroupClear'
  | 'moveNodes'
  | 'moveNodesStop';

/**
 * The complete state of the flow diagram.
 * Represents the current state of all nodes, edges, and metadata.
 *
 * @category Types
 */
export interface FlowState {
  /** All nodes currently in the diagram */
  nodes: Node[];
  /** All edges currently in the diagram */
  edges: Edge[];
  /** Diagram metadata (selection, viewport, etc.) */
  metadata: Metadata;
}

/**
 * Records a state update made by a specific middleware.
 * Used to track the history of state transformations through the middleware chain.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'audit-logger',
 *   execute: (context, next) => {
 *     // Check what previous middlewares did
 *     context.history.forEach(update => {
 *       console.log(`${update.name} modified:`, update.stateUpdate);
 *     });
 *     next();
 *   }
 * };
 * ```
 *
 * @category Types
 */
export interface MiddlewareHistoryUpdate {
  /** The name of the middleware that made the update */
  name: string;
  /** The state update that was applied */
  stateUpdate: FlowStateUpdate;
}

/**
 * Describes a set of changes to apply to the diagram state.
 * Middlewares can modify state by passing a FlowStateUpdate to the `next()` function.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'auto-arranger',
 *   execute: (context, next) => {
 *     // Apply state changes
 *     next({
 *       nodesToUpdate: [
 *         { id: 'node1', position: { x: 100, y: 200 } },
 *         { id: 'node2', position: { x: 300, y: 200 } }
 *       ],
 *       metadataUpdate: {
 *         viewport: { x: 0, y: 0, zoom: 1 }
 *       }
 *     });
 *   }
 * };
 * ```
 *
 * @category Types
 */
export interface FlowStateUpdate {
  /** Nodes to add to the diagram */
  nodesToAdd?: Node[];
  /** Partial node updates (only changed properties need to be specified) */
  nodesToUpdate?: (Partial<Node> & { id: Node['id'] })[];
  /** IDs of nodes to remove from the diagram */
  nodesToRemove?: string[];
  /** Edges to add to the diagram */
  edgesToAdd?: Edge[];
  /** Partial edge updates (only changed properties need to be specified) */
  edgesToUpdate?: (Partial<Edge> & { id: Edge['id'] })[];
  /** IDs of edges to remove from the diagram */
  edgesToRemove?: string[];
  /** Partial metadata update (viewport, selection, etc.) */
  metadataUpdate?: Partial<Metadata>;
}

/**
 * Array of middlewares (readonly for type safety).
 *
 * @category Types
 */
export type MiddlewareArray = readonly Middleware[];

/**
 * Helper functions for checking what changed during middleware execution.
 * These helpers track all cumulative changes from the initial state update and all previous middlewares.
 *
 * @category Types
 */
export interface MiddlewareHelpers {
  /**
   * Checks if a specific node has been modified.
   * @param id - The node ID to check
   * @returns true if the node was modified (any property changed) by the initial state update or any previous middleware
   */
  checkIfNodeChanged: (id: string) => boolean;

  /**
   * Checks if a specific edge has been modified.
   * @param id - The edge ID to check
   * @returns true if the edge was modified (any property changed) by the initial state update or any previous middleware
   */
  checkIfEdgeChanged: (id: string) => boolean;

  /**
   * Checks if a specific node was added.
   * @param id - The node ID to check
   * @returns true if the node was added by the initial state update or any previous middleware
   */
  checkIfNodeAdded: (id: string) => boolean;

  /**
   * Checks if a specific node was removed.
   * @param id - The node ID to check
   * @returns true if the node was removed by the initial state update or any previous middleware
   */
  checkIfNodeRemoved: (id: string) => boolean;

  /**
   * Checks if a specific edge was added.
   * @param id - The edge ID to check
   * @returns true if the edge was added by the initial state update or any previous middleware
   */
  checkIfEdgeAdded: (id: string) => boolean;

  /**
   * Checks if a specific edge was removed.
   * @param id - The edge ID to check
   * @returns true if the edge was removed by the initial state update or any previous middleware
   */
  checkIfEdgeRemoved: (id: string) => boolean;

  /**
   * Checks if any node has one or more of the specified properties changed.
   * @param props - Array of property names to check (e.g., ['position', 'size'])
   * @returns true if any node has any of these properties modified by the initial state update or any previous middleware
   */
  checkIfAnyNodePropsChanged: (props: string[]) => boolean;

  /**
   * Checks if any edge has one or more of the specified properties changed.
   * @param props - Array of property names to check (e.g., ['sourcePosition', 'targetPosition'])
   * @returns true if any edge has any of these properties modified by the initial state update or any previous middleware
   */
  checkIfAnyEdgePropsChanged: (props: string[]) => boolean;

  /**
   * Checks if any nodes were added.
   * @returns true if at least one node was added by the initial state update or any previous middleware
   */
  anyNodesAdded: () => boolean;

  /**
   * Checks if any edges were added.
   * @returns true if at least one edge was added by the initial state update or any previous middleware
   */
  anyEdgesAdded: () => boolean;

  /**
   * Checks if any nodes were removed.
   * @returns true if at least one node was removed by the initial state update or any previous middleware
   */
  anyNodesRemoved: () => boolean;

  /**
   * Checks if any edges were removed.
   * @returns true if at least one edge was removed by the initial state update or any previous middleware
   */
  anyEdgesRemoved: () => boolean;

  /**
   * Gets all node IDs that have one or more of the specified properties changed.
   * @param props - Array of property names to check (e.g., ['position', 'size'])
   * @returns Array of node IDs that have any of these properties modified by the initial state update or any previous middleware
   */
  getAffectedNodeIds: (props: string[]) => string[];

  /**
   * Gets all edge IDs that have one or more of the specified properties changed.
   * @param props - Array of property names to check (e.g., ['sourcePosition', 'targetPosition'])
   * @returns Array of edge IDs that have any of these properties modified by the initial state update or any previous middleware
   */
  getAffectedEdgeIds: (props: string[]) => string[];

  /**
   * Gets all nodes that were added.
   * @returns Array of node instances that were added by the initial state update or any previous middleware
   */
  getAddedNodes: () => Node[];

  /**
   * Gets all edges that were added.
   * @returns Array of edge instances that were added by the initial state update or any previous middleware
   */
  getAddedEdges: () => Edge[];

  /**
   * Gets all nodes that were removed.
   * Uses `initialNodesMap` to access the removed instances.
   * @returns Array of node instances that were removed by the initial state update or any previous middleware
   */
  getRemovedNodes: () => Node[];

  /**
   * Gets all edges that were removed.
   * Uses `initialEdgesMap` to access the removed instances.
   * @returns Array of edge instances that were removed by the initial state update or any previous middleware
   */
  getRemovedEdges: () => Edge[];
}

/**
 * The context object passed to middleware execute functions.
 * Provides access to the current state, helper functions, and configuration.
 *
 * @example
 * ```typescript
 * const middleware: Middleware = {
 *   name: 'validation',
 *   execute: (context, next, cancel) => {
 *     // Check if any nodes were added
 *     if (context.helpers.anyNodesAdded()) {
 *       console.log('Nodes added:', context.state.nodes);
 *     }
 *
 *     // Access configuration
 *     console.log('Cell size:', context.config.background.cellSize);
 *
 *     // Check what action triggered this
 *     if (context.modelActionType === 'addNodes') {
 *       // Validate new nodes
 *       const isValid = validateNodes(context.state.nodes);
 *       if (!isValid) {
 *         cancel(); // Block the operation
 *         return;
 *       }
 *     }
 *
 *     next(); // Continue to next middleware
 *   }
 * };
 * ```
 *
 * @category Types
 */
export interface MiddlewareContext {
  /** The state before any modifications (before the initial action and before any middleware modifications) */
  initialState: FlowState;
  /** The current state (includes the initial modification and all changes from previous middlewares) */
  state: FlowState;
  /**
   * Map for quick node lookup by ID.
   * Contains the current state after previous middleware processing.
   * Use this to access nodes by ID instead of iterating through `state.nodes`.
   */
  nodesMap: Map<string, Node>;
  /**
   * Map for quick edge lookup by ID.
   * Contains the current state after previous middleware processing.
   * Use this to access edges by ID instead of iterating through `state.edges`.
   */
  edgesMap: Map<string, Edge>;
  /**
   * The initial nodes map before any modifications (before the initial action and before any middleware modifications).
   * Use this to compare state before and after all modifications.
   * Common usage: Access removed node instances that no longer exist in `nodesMap`.
   */
  initialNodesMap: Map<string, Node>;
  /**
   * The initial edges map before any modifications (before the initial action and before any middleware modifications).
   * Use this to compare state before and after all modifications.
   * Common usage: Access removed edge instances that no longer exist in `edgesMap`.
   */
  initialEdgesMap: Map<string, Edge>;
  /** The action that triggered the middleware execution */
  modelActionType: ModelActionType;
  /** Helper functions to check what changed (tracks all cumulative changes from the initial action and all previous middlewares) */
  helpers: MiddlewareHelpers;
  /** All state updates from previous middlewares in the chain */
  history: MiddlewareHistoryUpdate[];
  /** Manager for action states (resizing, linking, etc.) */
  actionStateManager: ActionStateManager;
  /** Manager for edge routing algorithms */
  edgeRoutingManager: EdgeRoutingManager;
  /**
   * The initial state update that triggered the middleware chain.
   * Middlewares can add their own updates to the state, so this may not contain all modifications
   * that will be applied. Use `helpers` to get actual knowledge about all changes.
   */
  initialUpdate: FlowStateUpdate;
  /** The current diagram configuration */
  config: FlowConfig;
  /** Environment information (browser, rendering engine, etc.) */
  environment: EnvironmentInfo;
}

/**
 * Middleware interface for intercepting and modifying diagram state changes.
 *
 * Middlewares form a chain where each can:
 * - Inspect the current state and action type
 * - Modify the state by passing updates to `next()`
 * - Block operations by calling `cancel()`
 * - Perform side effects (logging, validation, etc.)
 *
 * @template TName - The middleware name type (string literal for type safety)
 *
 * @example
 * ```typescript
 * // Read-only middleware that blocks modifications
 * const readOnlyMiddleware: Middleware<'read-only'> = {
 *   name: 'read-only',
 *   execute: (context, next, cancel) => {
 *     const blockedActions = ['addNodes', 'deleteNodes', 'updateNode'];
 *     if (blockedActions.includes(context.modelActionType)) {
 *       console.warn('Action blocked in read-only mode');
 *       cancel();
 *       return;
 *     }
 *     next();
 *   }
 * };
 *
 * // Auto-snap middleware that modifies positions
 * const snapMiddleware: Middleware<'auto-snap'> = {
 *   name: 'auto-snap',
 *   execute: (context, next) => {
 *     const gridSize = 20;
 *     const nodesToSnap = context.helpers.getAffectedNodeIds(['position']);
 *
 *     const updates = nodesToSnap.map(id => {
 *       const node = context.nodesMap.get(id)!;
 *       return {
 *         id,
 *         position: {
 *           x: Math.round(node.position.x / gridSize) * gridSize,
 *           y: Math.round(node.position.y / gridSize) * gridSize
 *         }
 *       };
 *     });
 *
 *     next({ nodesToUpdate: updates });
 *   }
 * };
 *
 * // Register middleware
 * ngDiagramService.registerMiddleware(snapMiddleware);
 * ```
 *
 * @category Types
 */
export interface Middleware<TName extends string = string> {
  /** Unique identifier for the middleware */
  name: TName;
  /**
   * The middleware execution function.
   *
   * @param context - Complete context including state, helpers, and configuration
   * @param next - Call this to continue to the next middleware (optionally with state updates)
   * @param cancel - Call this to abort the entire operation
   */
  execute: (
    context: MiddlewareContext,
    next: (stateUpdate?: FlowStateUpdate) => Promise<FlowState>,
    cancel: () => void
  ) => Promise<void> | void;
}

/**
 * An array of middlewares that will be executed in sequence.
 *
 * @category Types
 */
export type MiddlewareChain = Middleware[];
