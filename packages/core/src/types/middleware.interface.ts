import type { Edge } from './edge.interface';
import type { Node } from './node.interface';

/**
 * Type for model-specific actions in the flow diagram
 */
export interface ModelAction {
  name: 'selectionChange';
  data: { id: string; selected: boolean };
}

/**
 * Type for the Nodes and Edges diff of the flow state
 */
interface NodesEdgesDiff<T extends { id: string }, IdKey extends keyof T = 'id'> {
  added?: T[];
  removed?: IdKey[];
  updated?: Partial<T>[];
}

/**
 * Type for the MetaData diff of the flow state
 */
interface MetaDataDiff {
  added?: Record<string, unknown>;
  removed?: string[];
  updated?: Record<string, unknown>;
}

/**
 * Type for the diff of the flow state
 */
export interface FlowStateDiff {
  nodes?: NodesEdgesDiff<Node>;
  edges?: NodesEdgesDiff<Edge>;
  metaData?: MetaDataDiff;
}

/**
 * Type for the state of the flow diagram
 */
export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  metadata: Record<string, unknown>;
}

/**
 * Type for the context of a middleware operation
 */
export interface MiddlewareContext {
  modelAction: ModelAction;
  initialState: FlowState;
}

/**
 * Type for middleware function that transforms state
 * @template TState - Type of the state being modified
 */
export type Middleware = (
  /**
   * Current state diff
   */
  stateDiff: FlowStateDiff,
  /**
   * Context of the operation
   */
  context: MiddlewareContext
) => FlowStateDiff;

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain = Middleware[];
