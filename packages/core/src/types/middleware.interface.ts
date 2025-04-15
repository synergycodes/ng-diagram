import { Node } from './node.interface';
import { Edge } from './edge.interface';

/**
 * Type for model-specific actions in the flow diagram
 */
export type ModelAction = 
    | 'setNodes'
    | 'setEdges'
    | 'setMetadata';

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
    action: string;
    modelAction: ModelAction;
    previousState: FlowState;
}

/**
 * Type for middleware function that transforms state
 * @template TState - Type of the state being modified
 */
export type Middleware<TState = FlowState> = (
    /**
     * Current state to be transformed
     */
    state: TState,
    /**
     * Context of the operation
     */
    context: MiddlewareContext
) => TState;

/**
 * Type for middleware chain
 * @template TState - Type of the state being modified
 */
export type MiddlewareChain<TState = FlowState> = Middleware<TState>[]; 