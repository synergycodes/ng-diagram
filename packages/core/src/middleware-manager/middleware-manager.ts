import { FlowCore } from '../flow-core';
import type { FlowState, Middleware, MiddlewareChain, ModelActionType } from '../types';
import { edgesStraightRoutingMiddleware } from './middlewares/edges-straight-routing';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];
  readonly flowCore: FlowCore;

  constructor(flowCore: FlowCore, middlewares: Middleware[] = []) {
    this.flowCore = flowCore;
    this.register(edgesStraightRoutingMiddleware);
    middlewares.forEach((middleware) => this.register(middleware));
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware to register
   * @returns Function to unregister the middleware
   */
  register(middleware: Middleware): () => void {
    if (this.middlewareChain.find((m) => m.name === middleware.name)) {
      throw new Error(`Middleware ${middleware.name} already registered`);
    }
    this.middlewareChain.push(middleware);
    return () => this.unregister(middleware.name);
  }

  /**
   * Unregisters a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregister(name: string): void {
    const index = this.middlewareChain.findIndex((middleware) => middleware.name === name);
    if (index !== -1) {
      this.middlewareChain.splice(index, 1);
    }
  }

  /**
   * Executes all registered middlewares in sequence
   * @param prevState Initial state to be transformed
   * @param nextState Next state to be transformed
   * @param modelActionType Model action type which triggers the middleware
   * @returns State after all middlewares have been applied
   */
  execute(prevState: FlowState, nextState: FlowState, modelActionType: ModelActionType) {
    return new Promise<FlowState | undefined>((finalResolve) => {
      const resolvers: (() => void)[] = [];
      const middlewaresExecutedIndexes = new Set<number>();
      let currentState = { ...nextState };

      const context = {
        state: currentState,
        initialState: prevState,
        modelActionType,
        flowCore: this.flowCore,
      };

      const dispatch = (i: number) =>
        new Promise<void>((resolve) => {
          const middleware = this.middlewareChain[i];

          if (!middleware) {
            while (resolvers.length > 0) {
              resolvers.pop()?.();
            }
            return finalResolve(currentState);
          }

          if (middlewaresExecutedIndexes.has(i)) {
            throw new Error(`Middleware ${middleware.name} executed next() multiple times`);
          }
          middlewaresExecutedIndexes.add(i);

          resolvers.push(resolve);

          const next = async (partialUpdate?: Partial<FlowState>) => {
            if (partialUpdate) {
              currentState = {
                ...currentState,
                ...partialUpdate,
              };
            }
            await dispatch(i + 1);
          };
          const cancel = () => {
            while (resolvers.length > 0) {
              resolvers.pop()?.();
            }
            finalResolve(undefined);
          };

          middleware.execute(context, next, cancel);
        });

      dispatch(0);
    });
  }
}
