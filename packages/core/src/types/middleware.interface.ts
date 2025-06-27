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
  | 'moveNodesBy'
  | 'deleteSelection'
  | 'addNodes'
  | 'updateNode'
  | 'updateNodes'
  | 'deleteNodes'
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
  | 'rotateNodeBy'
  | 'highlightGroup'
  | 'highlightGroupClear'
  | 'treeLayout';

/**
 * Type for the state of the flow diagram
 */
export interface FlowState<TMetadata = Metadata> {
  nodes: Node[];
  edges: Edge[];
  metadata: TMetadata;
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
export interface MiddlewareContext<TMiddlewareMetadata = unknown> {
  initialState: FlowState;
  state: FlowState;
  nodesMap: Map<string, Node>;
  edgesMap: Map<string, Edge>;
  modelActionType: ModelActionType;
  flowCore: FlowCore;
  helpers: ReturnType<MiddlewareExecutor['helpers']>;
  history: MiddlewareHistoryUpdate[];
  initialUpdate: FlowStateUpdate;
  middlewareMetadata: TMiddlewareMetadata;
}

/**
 * Type for middleware function that transforms state
 * @template TMetadata - Type of the metadata of the middleware
 * @template TName - Type of the name of the middleware (should be a string literal)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Middleware<TName extends string = string, TMetadata = any> {
  name: TName;
  execute: (
    context: MiddlewareContext<TMetadata>,
    next: (stateUpdate?: FlowStateUpdate) => Promise<FlowState>,
    cancel: () => void
  ) => Promise<void> | void;
  defaultMetadata?: TMetadata;
}

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
