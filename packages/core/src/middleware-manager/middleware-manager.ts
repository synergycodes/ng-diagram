import { FlowCore } from '../flow-core';
import type { FlowState, FlowStateUpdate, Middleware, MiddlewareChain, ModelActionType } from '../types';
import { MiddlewareExecutor } from './middleware-executor';
import { groupChildrenChangeExtent } from './middlewares/group-children-change-extent';
import { groupChildrenMoveExtent } from './middlewares/group-children-move-extent';
import { nodePositionSnapMiddleware } from './middlewares/node-position-snap';
import { nodeRotationSnapMiddleware } from './middlewares/node-rotation-snap';
import { edgesRoutingMiddleware } from './middlewares/edges-routing/edges-routing.ts';

export class MiddlewareManager {
  private middlewareChain: MiddlewareChain = [];
  readonly flowCore: FlowCore;

  constructor(flowCore: FlowCore, middlewares: Middleware[] = []) {
    this.flowCore = flowCore;
    this.register(nodePositionSnapMiddleware);
    this.register(nodeRotationSnapMiddleware);
    this.register(groupChildrenChangeExtent);
    this.register(groupChildrenMoveExtent);
    this.register(edgesRoutingMiddleware);
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
   * @param initialState Initial state to be transformed
   * @param stateUpdate State update to be applied
   * @param modelActionType Model action type which triggers the middleware
   * @returns State after all middlewares have been applied
   */
  execute(initialState: FlowState, stateUpdate: FlowStateUpdate, modelActionType: ModelActionType) {
    const middlewareExecutor = new MiddlewareExecutor(this.flowCore, this.middlewareChain);
    return middlewareExecutor.run(initialState, stateUpdate, modelActionType);
  }
}
