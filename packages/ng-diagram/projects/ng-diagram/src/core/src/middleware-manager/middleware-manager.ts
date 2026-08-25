import { FlowCore } from '../flow-core';
import type { FlowState, FlowStateUpdate, Middleware, MiddlewareChain, ModelActionTypes } from '../types';
import { MiddlewareExecutor } from './middleware-executor';
import {
  createEventEmitterMiddleware,
  createHiddenComputationMiddleware,
  createMeasurementTrackingMiddleware,
  loggerMiddleware,
  measuredBoundsMiddleware,
} from './middlewares';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];
  private eventEmitterMiddleware: Middleware | null = null;
  private measurementTrackingMiddleware: Middleware | null = null;
  private hiddenComputationMiddleware: Middleware | null = null;
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
   * @param modelActionTypes Model action types which trigger the middleware (array for transactions, single-element for direct calls)
   * @returns State after all middlewares have been applied
   */
  async execute(
    initialState: FlowState,
    stateUpdate: FlowStateUpdate,
    modelActionTypes: ModelActionTypes
  ): Promise<FlowState | undefined> {
    if (!this.eventEmitterMiddleware && this.flowCore.eventManager) {
      this.eventEmitterMiddleware = createEventEmitterMiddleware(this.flowCore.eventManager);
    }

    if (!this.measurementTrackingMiddleware && this.flowCore.measurementTracker) {
      this.measurementTrackingMiddleware = createMeasurementTrackingMiddleware(this.flowCore.measurementTracker);
    }

    if (!this.hiddenComputationMiddleware && this.flowCore.templateVisibilityRegistry) {
      this.hiddenComputationMiddleware = createHiddenComputationMiddleware(this.flowCore.templateVisibilityRegistry);
    }

    // Middleware execution order:
    // 1. hiddenComputationMiddleware - stamp effective visibility (computedHidden)
    //    first so user middlewares and the built-in tail read fresh values
    // 2. User and default middlewares - custom processing
    // 3. measuredBoundsMiddleware - compute node bounds after all position/size changes
    // 4. loggerMiddleware - log final state for debugging
    // 5. measurementTrackingMiddleware - signal measurement activity
    // 6. eventEmitterMiddleware - emit events with final state
    const finalChain = [
      ...(this.hiddenComputationMiddleware ? [this.hiddenComputationMiddleware] : []),
      ...this.middlewareChain,
      measuredBoundsMiddleware,
      loggerMiddleware,
      ...(this.measurementTrackingMiddleware ? [this.measurementTrackingMiddleware] : []),
      ...(this.eventEmitterMiddleware ? [this.eventEmitterMiddleware] : []),
    ];

    const middlewareExecutor = new MiddlewareExecutor(this.flowCore, finalChain);
    return await middlewareExecutor.run(initialState, stateUpdate, modelActionTypes);
  }
}
