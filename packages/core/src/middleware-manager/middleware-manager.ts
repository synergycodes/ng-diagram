import { FlowCore } from '../flow-core';
import type {
  FlowState,
  FlowStateUpdate,
  LooseAutocomplete,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewareConfigKeys,
  MiddlewaresConfigFromMiddlewares,
  ModelActionType,
} from '../types';
import { MiddlewareExecutor } from './middleware-executor';

export class MiddlewareManager<
  TCustomMiddlewares extends MiddlewareChain = [],
  TMetadata extends Metadata<MiddlewaresConfigFromMiddlewares<TCustomMiddlewares>> = Metadata<
    MiddlewaresConfigFromMiddlewares<TCustomMiddlewares>
  >,
> {
  private middlewareChain: MiddlewareChain = [];
  readonly flowCore: FlowCore<TCustomMiddlewares, TMetadata>;

  constructor(flowCore: FlowCore<TCustomMiddlewares, TMetadata>, middlewares?: TCustomMiddlewares) {
    this.flowCore = flowCore;

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
    if (middleware.defaultMetadata) {
      this.applyMiddlewareConfig(middleware.name, middleware.defaultMetadata);
    }

    return () => this.unregister(middleware.name);
  }

  /**
   * Unregister a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregister(name: MiddlewareConfigKeys<TCustomMiddlewares>): void {
    const index = this.middlewareChain.findIndex((middleware) => middleware.name === name);
    if (index !== -1) {
      this.middlewareChain.splice(index, 1);
      this.applyMiddlewareConfig(name, undefined);
    }
  }

  /**
   * Executes all registered middlewares in sequence
   * @param initialState Initial state to be transformed
   * @param stateUpdate State update to be applied
   * @param modelActionType Model action type which triggers the middleware
   * @returns State after all middlewares have been applied
   */
  async execute(
    initialState: FlowState<TMetadata>,
    stateUpdate: FlowStateUpdate,
    modelActionType: LooseAutocomplete<ModelActionType>
  ): Promise<FlowState<TMetadata> | undefined> {
    const middlewareExecutor = new MiddlewareExecutor(this.flowCore, this.middlewareChain);
    return await middlewareExecutor.run(initialState, stateUpdate, modelActionType as ModelActionType);
  }

  /**
   * Assigns middleware configuration with full type safety
   * @param middlewareName - The name of the middleware to update
   * @param config - The configuration of the middleware
   */
  applyMiddlewareConfig<TName extends MiddlewareConfigKeys<TCustomMiddlewares>>(
    middlewareName: TName,
    config?: TMetadata['middlewaresConfig'][TName]
  ): void {
    const state = this.flowCore.getState();

    if (typeof config === 'undefined') {
      // If config is undefined, remove the property
      delete state.metadata.middlewaresConfig[middlewareName];
    } else {
      // Otherwise, assign the config
      state.metadata.middlewaresConfig[middlewareName] = config;
    }

    this.flowCore.setState(state);
  }

  /**
   * Gets the middleware configuration
   * @param middlewareName Name of the middleware to get the configuration for
   * @returns The middleware configuration
   */
  getMiddlewareConfig<TName extends MiddlewareConfigKeys<TCustomMiddlewares>>(
    middlewareName: TName
  ): TMetadata['middlewaresConfig'][TName] {
    const state = this.flowCore.getState();
    const middleware = this.middlewareChain.find((middleware) => middleware.name === middlewareName);

    if (!middleware) {
      console.warn(`[AngularFlow] Accessing middleware config for "${middlewareName}" not found`);
    }

    const middlewareConfig = state.metadata.middlewaresConfig[middlewareName] ?? {};

    // NOTE: This is not a deep merge
    return { ...(middleware?.defaultMetadata ?? {}), ...middlewareConfig };
  }
}
