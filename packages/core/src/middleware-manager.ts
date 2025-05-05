import type {
  FlowState,
  Middleware,
  MiddlewareChain,
  MiddlewareHistoryUpdate,
  ModelActionType,
} from './types/middleware.interface';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];

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
   * @param state Initial state to be transformed
   * @param modelActionType Model action type which triggers the middleware
   * @returns State after all middlewares have been applied
   */
  execute(prevState: FlowState, nextState: FlowState, modelActionType: ModelActionType): FlowState {
    const historyUpdates: MiddlewareHistoryUpdate[] = [{ name: modelActionType, prevState, nextState }];
    return this.middlewareChain.reduce(
      ({ currentState, historyUpdates }, middleware) => {
        const updatedState = middleware.execute(currentState, {
          initialState: prevState,
          modelActionType,
          historyUpdates,
        });
        if (Object.is(updatedState, currentState)) {
          return { currentState, historyUpdates };
        }
        return {
          currentState: updatedState,
          historyUpdates: [
            ...historyUpdates,
            { name: middleware.name, prevState: currentState, nextState: updatedState },
          ],
        };
      },
      { currentState: nextState, historyUpdates }
    ).currentState;
  }
}
