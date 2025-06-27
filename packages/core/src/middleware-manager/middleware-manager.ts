import { FlowCore } from '../flow-core';
import type {
  CombinedMiddlewaresMetadata,
  FlowState,
  FlowStateUpdate,
  Metadata,
  Middleware,
  MiddlewareChain,
  ModelActionType,
} from '../types';
import { defaultMiddlewares } from './default-middlewares';
import { MiddlewareExecutor } from './middleware-executor';

export class MiddlewareManager<
  TCustomMiddlewares extends MiddlewareChain = [],
  TMetadata extends Metadata<CombinedMiddlewaresMetadata<TCustomMiddlewares>> = Metadata<
    CombinedMiddlewaresMetadata<TCustomMiddlewares>
  >,
> {
  private middlewareChain: MiddlewareChain = [];
  readonly flowCore: FlowCore<TCustomMiddlewares, TMetadata>;

  constructor(flowCore: FlowCore<TCustomMiddlewares, TMetadata>, middlewares?: TCustomMiddlewares) {
    this.flowCore = flowCore;

    defaultMiddlewares.forEach((middleware) => this.register(middleware));

    if (middlewares) {
      middlewares.forEach((middleware) => this.register(middleware));
    }
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware to register
   * @returns Function to unregister the middleware
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register<T extends Middleware<any>>(middleware: T): () => void {
    if (this.middlewareChain.find((m) => m.name === middleware.name)) {
      throw new Error(`Middleware ${middleware.name} already registered`);
    }
    this.middlewareChain.push(middleware);
    return () => this.unregister(middleware.name);
  }

  /**
   * Unregister a middleware from the chain
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
   * @param initialState Initial state to be transformed
   * @param stateUpdate State update to be applied
   * @param modelActionType Model action type which triggers the middleware
   * @returns State after all middlewares have been applied
   */
  execute(initialState: FlowState<TMetadata>, stateUpdate: FlowStateUpdate, modelActionType: ModelActionType) {
    const middlewareExecutor = new MiddlewareExecutor<TCustomMiddlewares, TMetadata>(
      this.flowCore,
      this.middlewareChain
    );
    return middlewareExecutor.run(initialState, stateUpdate, modelActionType);
  }
}
