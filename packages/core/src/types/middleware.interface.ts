import type { ActionStateManager } from '../action-state-manager/action-state-manager';
import type { EdgeRoutingManager } from '../edge-routing-manager';
import type { MiddlewareExecutor } from '../middleware-manager/middleware-executor';
import type { Edge } from './edge.interface';
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
  | 'treeLayout'
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
 */
export interface MiddlewareContext {
  initialState: FlowState;
  state: FlowState;
  nodesMap: Map<string, Node>;
  edgesMap: Map<string, Edge>;
  modelActionType: ModelActionType;
  helpers: ReturnType<MiddlewareExecutor['helpers']>;
  history: MiddlewareHistoryUpdate[];
  actionStateManager: ActionStateManager;
  edgeRoutingManager: EdgeRoutingManager;
  initialUpdate: FlowStateUpdate;
  config: FlowConfig;
}

/**
 * Type for middleware function that transforms state
 * @template TMetadata - Type of the metadata of the middleware
 * @template TName - Type of the name of the middleware (should be a string literal)
 */

export interface Middleware<TName extends string = string> {
  name: TName;
  execute: (
    context: MiddlewareContext,
    next: (stateUpdate?: FlowStateUpdate) => Promise<FlowState>,
    cancel: () => void
  ) => Promise<void> | void;
}

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
