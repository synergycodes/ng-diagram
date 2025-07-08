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
  | 'treeLayout'
  | 'moveNodes'
  | 'moveNodesStop';

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
export interface MiddlewareHistoryUpdate<TCustomMiddlewares extends MiddlewareChain> {
  name: MiddlewareConfigKeys<TCustomMiddlewares>;
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

// Helper type to extract config type from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareConfig<T> = T extends Middleware<any, infer M> ? M : never;

// Helper type to extract the name from a middleware
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExtractMiddlewareName<T> = T extends Middleware<infer N, any> ? N : never;

// Type to create the config map from middleware array
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MiddlewaresConfigFromMiddlewares<T extends readonly Middleware<any, any>[]> = {
  [K in T[number] as ExtractMiddlewareName<K>]: ExtractMiddlewareConfig<K>;
};

export type MiddlewareArray = readonly Middleware[];

/**
 * Type for the context of the middleware
 */
export interface MiddlewareContext<
  TCustomMiddlewares extends MiddlewareChain = [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TMetadata extends Metadata<any> = Metadata,
  TMiddlewareMetadata = unknown,
> {
  initialState: FlowState<TMetadata>;
  state: FlowState<TMetadata>;
  nodesMap: Map<string, Node>;
  edgesMap: Map<string, Edge>;
  modelActionType: ModelActionType;
  flowCore: FlowCore;
  helpers: ReturnType<MiddlewareExecutor<TCustomMiddlewares, TMetadata>['helpers']>;
  history: MiddlewareHistoryUpdate<TCustomMiddlewares>[];
  initialUpdate: FlowStateUpdate;
  middlewareMetadata: TMiddlewareMetadata;
}

export type MiddlewareConfigKeys<TCustomMiddlewares extends MiddlewareChain> =
  keyof MiddlewaresConfigFromMiddlewares<TCustomMiddlewares> & string;

/**
 * Type for middleware function that transforms state
 * @template TMetadata - Type of the metadata of the middleware
 * @template TName - Type of the name of the middleware (should be a string literal)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Middleware<TName extends string = string, TMiddlewareMetadata = any> {
  name: TName;
  execute: (
    context: MiddlewareContext<
      MiddlewareChain,
      Metadata<MiddlewaresConfigFromMiddlewares<MiddlewareChain>>,
      TMiddlewareMetadata
    >,
    next: (stateUpdate?: FlowStateUpdate) => Promise<FlowState<TMiddlewareMetadata>>,
    cancel: () => void
  ) => Promise<void> | void;
  defaultMetadata?: TMiddlewareMetadata;
}

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
