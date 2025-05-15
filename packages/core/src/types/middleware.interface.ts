import type { FlowCore } from '../flow-core';
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
  | 'zoom';

/**
 * Type for the state of the flow diagram
 */
export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  metadata: Metadata;
}

export interface MiddlewareHistoryUpdate {
  name: string;
  prevState: FlowState;
  nextState: FlowState;
}

/**
 * Type for the context of a middleware operation
 */
export interface MiddlewareContext {
  initialState: FlowState;
  modelActionType: ModelActionType;
  historyUpdates: MiddlewareHistoryUpdate[];
}

/**
 * Type for middleware function that transforms state
 */
export interface Middleware {
  name: string;
  execute: (
    /**
     * Current state
     */
    state: FlowState,
    /**
     * Context of the operation
     */
    context: MiddlewareContext,
    /**
     * Flow core
     */
    flowCore: FlowCore
  ) => FlowState;
}

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
