import type { ActionStateManager } from '../action-state-manager/action-state-manager';
import type { EdgeRoutingManager } from '../edge-routing-manager';
import type { MiddlewareExecutor } from '../middleware-manager/middleware-executor';
import type { Edge } from './edge.interface';
import { EnvironmentInfo } from './environment.interface';
import { FlowConfig } from './flow-config.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Type for model-specific actions types in the flow diagram
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
 * Type for the state of the flow diagram
 */
export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  metadata: Metadata;
}

/**
 * Type for the history update to be applied to the flow diagram
 */
export interface MiddlewareHistoryUpdate {
  name: string;
  stateUpdate: FlowStateUpdate;
}

/**
 * Type for the state update to be applied to the flow diagram
 */
export interface FlowStateUpdate {
  nodesToAdd?: Node[];
  nodesToUpdate?: (Partial<Node> & { id: Node['id'] })[];
  nodesToRemove?: string[];
  edgesToAdd?: Edge[];
  edgesToUpdate?: (Partial<Edge> & { id: Edge['id'] })[];
  edgesToRemove?: string[];
  metadataUpdate?: Partial<Metadata>;
}

export type MiddlewareArray = readonly Middleware[];

/**
 * Type for the context of the middleware
 *
 * @category Types
 */
export interface MiddlewareContext {
  /** The initial state of the flow diagram */
  initialState: FlowState;
  /** The current state of the flow diagram */
  state: FlowState;
  /** A map of node IDs to their corresponding node objects */
  nodesMap: Map<string, Node>;
  /** A map of edge IDs to their corresponding edge objects*/
  edgesMap: Map<string, Edge>;
  /** The initial map of node IDs to their corresponding node objects */
  initialNodesMap: Map<string, Node>;
  /** The initial map of edge IDs to their corresponding edge objects */
  initialEdgesMap: Map<string, Edge>;
  /** The type of action that triggered the middleware */
  modelActionType: ModelActionType;
  /** The helper functions available to the middleware */
  helpers: ReturnType<MiddlewareExecutor['helpers']>;
  /** The history updates that have been applied so far */
  history: MiddlewareHistoryUpdate[];
  /** The action state manager */
  actionStateManager: ActionStateManager;
  /** The edge routing manager */
  edgeRoutingManager: EdgeRoutingManager;
  /** The initial update to the flow state */
  initialUpdate: FlowStateUpdate;
  /** The configuration for the flow diagram */
  config: FlowConfig;
  /** The environment information */
  environment: EnvironmentInfo;
}

/**
 * Type for middleware function that transforms state
 * @template TMetadata - Type of the metadata of the middleware
 * @template TName - Type of the name of the middleware (should be a string literal)
 *
 * @category Types
 */

/**
 * Interface for middleware that can modify the flow state
 * @template TName - Type of the name of the middleware (should be a string literal)
 *
 * @category Types
 */
export interface Middleware<TName extends string = string> {
  /** The name of the middleware */
  name: TName;
  /** The function that executes the middleware logic */
  execute: (
    /** The context of the middleware */
    context: MiddlewareContext,
    /** Function to call to apply the state update and continue to the next middleware */
    next: (stateUpdate?: FlowStateUpdate) => Promise<FlowState>,
    /** Function to call to cancel the middleware execution */
    cancel: () => void
  ) => Promise<void> | void;
}

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 *
 * @category Types
 */
export type MiddlewareChain = Middleware[];
