import { FlowCore } from '../flow-core';
import type {
  FlowState,
  FlowStateUpdate,
  LooseAutocomplete,
  Middleware,
  MiddlewareChain,
  ModelActionType,
} from '../types';
import { MiddlewareExecutor } from './middleware-executor';
import { createEventEmitterMiddleware, loggerMiddleware, measuredBoundsMiddleware } from './middlewares';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];
  private eventEmitterMiddleware: Middleware | null = null;
  readonly flowCore: FlowCore;

  constructor(flowCore: FlowCore, middlewares?: MiddlewareChain) {
    this.flowCore = flowCore;

    if (middlewares) {
      middlewares.forEach((middleware) => this.register(middleware));
    }
  }

  isRegistered(name: string): boolean {
    return !!this.middlewareChain.find((m) => m.name === name);
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware to register
   * @returns Function to unregister the middleware
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register<T extends Middleware<any>>(middleware: T): () => void {
    if (this.isRegistered(middleware.name)) {
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
  async execute(
    initialState: FlowState,
    stateUpdate: FlowStateUpdate,
    modelActionType: LooseAutocomplete<ModelActionType>
  ): Promise<FlowState | undefined> {
    if (!this.eventEmitterMiddleware && this.flowCore.eventManager) {
      this.eventEmitterMiddleware = createEventEmitterMiddleware(this.flowCore.eventManager);
    }

    // measuredBoundsMiddleware runs after all user middlewares to ensure bounds are computed
    // after all position/size changes. loggerMiddleware runs after measuredBounds to log final state.
    // eventEmitterMiddleware runs last to emit events with final state.
    const finalChain = [
      ...this.middlewareChain,
      measuredBoundsMiddleware,
      loggerMiddleware,
      ...(this.eventEmitterMiddleware ? [this.eventEmitterMiddleware] : []),
    ];

    const middlewareExecutor = new MiddlewareExecutor(this.flowCore, finalChain);
    return await middlewareExecutor.run(initialState, stateUpdate, modelActionType as ModelActionType);
  }
}
