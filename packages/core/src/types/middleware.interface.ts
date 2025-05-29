import type { FlowCore } from '../flow-core';
import { MiddlewareExecutor } from '../middleware-manager/middleware-executor';
import type { Edge } from './edge.interface';
import type { Metadata } from './metadata.interface';
import type { Node } from './node.interface';

/**
 * Type for model-specific actions types in the flow diagram
 */
export type ModelActionType =
  | 'init'
  | 'changeSelection'
  | 'moveSelection'
  | 'deleteSelection'
  | 'addNodes'
  | 'updateNode'
  | 'deleteNodes'
  | 'addEdges'
  | 'updateEdge'
  | 'deleteEdges'
  | 'paste'
  | 'moveViewport'
  | 'resizeNode'
  | 'startLinking'
  | 'moveTemporaryEdge'
  | 'finishLinking'
  | 'zoom'
  | 'changeZOrder';

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

/**
 * Type for the context of the middleware
 */
export interface MiddlewareContext {
  initialState: FlowState;
  state: FlowState;
  nodesMap: Map<string, Node>;
  edgesMap: Map<string, Edge>;
  modelActionType: ModelActionType;
  flowCore: FlowCore;
  helpers: ReturnType<MiddlewareExecutor['helpers']>;
  history: MiddlewareHistoryUpdate[];
  initialUpdate: FlowStateUpdate;
}

/**
 * Type for middleware function that transforms state
 */
export interface Middleware {
  name: string;
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
