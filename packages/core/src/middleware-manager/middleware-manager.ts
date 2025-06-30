import { FlowCore } from '../flow-core';
import type {
  CombinedMiddlewaresConfig,
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
  TMetadata extends Metadata<CombinedMiddlewaresConfig<TCustomMiddlewares>> = Metadata<
    CombinedMiddlewaresConfig<TCustomMiddlewares>
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

    // Apply default metadata if it exists
    if (middleware.defaultMetadata) {
      this.applyMiddlewareConfig(
        middleware.name as keyof TMetadata['middlewaresConfig'],
        middleware.defaultMetadata as TMetadata['middlewaresConfig'][keyof TMetadata['middlewaresConfig']]
      );
    }

    this.middlewareChain.push(middleware);
    return () => this.unregister(middleware.name);
  }

  /**
   * Unregister a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregister(name: keyof TMetadata['middlewaresConfig']): void {
    const index = this.middlewareChain.findIndex((middleware) => middleware.name === name);
    if (index !== -1) {
      this.removeMiddlewareConfig(name);
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

  /**
   * Assigns middleware configuration with full type safety
   * @param middlewareName - The name of the middleware to update
   * @param config - The configuration of the middleware
   */
  applyMiddlewareConfig<TName extends keyof TMetadata['middlewaresConfig']>(
    middlewareName: TName,
    config?: TMetadata['middlewaresConfig'][TName]
  ): void {
    const state = this.flowCore.getState();

    (state.metadata.middlewaresConfig as Record<string, unknown>)[middlewareName as string] = config || null;

    this.flowCore.setState(state);
  }

  /**
   * Removes a middleware configuration
   * @param middlewareName Name of the middleware to remove
   */
  removeMiddlewareConfig<TName extends keyof TMetadata['middlewaresConfig']>(middlewareName: TName): void {
    const state = this.flowCore.getState();

    delete (state.metadata.middlewaresConfig as Record<string, unknown>)[middlewareName as string];

    this.flowCore.setState(state);
  }
}
