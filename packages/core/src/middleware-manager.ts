import type { FlowState, Middleware, MiddlewareChain, MiddlewareContext } from './types/middleware.interface';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware function to register
   * @returns Function to unregister the middleware
   */
  register(middleware: Middleware): () => void {
    this.middlewareChain.push(middleware);
    return () => this.unregister(middleware);
  }

  /**
   * Unregisters a middleware from the chain
   * @param middleware Middleware function to unregister
   */
  unregister(middleware: Middleware): void {
    const index = this.middlewareChain.indexOf(middleware);
    if (index !== -1) {
      this.middlewareChain.splice(index, 1);
    }
  }

  /**
   * Executes all registered middlewares in sequence
   * @param state Initial state to be transformed
   * @param context Context for the middleware execution
   * @returns Transformed state after all middlewares have been applied
   */
  execute(state: FlowState, context: MiddlewareContext): FlowState {
    return this.middlewareChain.reduce((currentState, middleware) => middleware(currentState, context), state);
  }
}
