import { CoreCommandHandler } from './command-handler';
import { commands } from './commands';
import { MiddlewareManager } from './middleware-manager';
import type { EventMapper } from './types/event-mapper.interface';
import type { InputEventHandler } from './types/input-event-handler.abstract';
import type { FlowState, Middleware, ModelActionType } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

type EventHandlerFactory = (commandHandler: CoreCommandHandler, eventMapper: EventMapper) => InputEventHandler;

export class FlowCore {
  private commandHandler: CoreCommandHandler;
  private _eventHandler: InputEventHandler;
  private readonly middlewareManager: MiddlewareManager;

  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    createEventHandler: EventHandlerFactory
  ) {
    this.commandHandler = new CoreCommandHandler(this, commands);
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper);
    this.middlewareManager = new MiddlewareManager();
  }

  /**
   * Gets the current EventHandler instance
   */
  get eventHandler(): InputEventHandler {
    return this._eventHandler;
  }

  /**
   * Changes the current EventHandler implementation
   * @param createEventHandler Factory function that creates a new EventHandler instance
   */
  setEventHandler(createEventHandler: EventHandlerFactory): void {
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper);
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware function to register
   * @returns Function to unregister the middleware
   */
  registerMiddleware(middleware: Middleware): () => void {
    return this.middlewareManager.register(middleware);
  }

  /**
   * Unregisters a middleware from the chain
   * @param middleware Middleware function to unregister
   */
  unregisterMiddleware(middleware: Middleware): void {
    this.middlewareManager.unregister(middleware);
  }

  /**
   * Gets the current state of the flow
   */
  getState(): FlowState {
    return {
      nodes: this.modelAdapter.getNodes(),
      edges: this.modelAdapter.getEdges(),
      metadata: this.modelAdapter.getMetadata(),
    };
  }

  /**
   * Applies an update to the flow state
   * @param state Partial state to apply
   * @param modelActionType Type of model action to apply
   */
  applyUpdate(state: Partial<FlowState>, modelActionType: ModelActionType): void {
    const updatedState = { ...this.getState(), ...state };
    const finalState = this.middlewareManager.execute(this.getState(), updatedState, modelActionType);
    // TODO: Handle applying diff on model properly and not just replace the whole state
    const { nodes, edges, metadata } = finalState;
    this.modelAdapter.setNodes(nodes);
    this.modelAdapter.setEdges(edges);
    this.modelAdapter.setMetadata(metadata);
  }
}
