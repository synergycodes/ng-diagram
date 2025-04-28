import type { Edge } from './edge.interface';
import type { Node } from './node.interface';

/**
 * Type for model-specific actions types in the flow diagram
 */
export type ModelActionType = 'selectionChange' | 'moveSelection';

/**
 * Type for the state of the flow diagram
 */
export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  metadata: Record<string, unknown>;
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
  modelActionType: ModelActionType;
  historyUpdates: MiddlewareHistoryUpdate[];
}

/**
 * Type for middleware function that transforms state
 */
export type Middleware = (
  /**
   * Current state
   */
  state: FlowState,
  /**
   * Context of the operation
   */
  context: MiddlewareContext
) => FlowState;

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
