import { CoreCommandHandler } from './command-handler';
import { MiddlewareManager } from './middleware-manager';
import type { EnvironmentInfo } from './types/environment.interface';
import type { EventMapper } from './types/event-mapper.interface';
import type { InputEventHandler } from './types/input-event-handler.abstract';
import type { FlowState, Middleware, ModelActionType } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

type EventHandlerFactory = (
  commandHandler: CoreCommandHandler,
  eventMapper: EventMapper,
  environment: EnvironmentInfo
) => InputEventHandler;

export class FlowCore {
  private commandHandler: CoreCommandHandler;
  private _eventHandler: InputEventHandler;
  private readonly middlewareManager: MiddlewareManager;
  private readonly environment: EnvironmentInfo;

  constructor(
    private readonly modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    createEventHandler: EventHandlerFactory,
    environment: EnvironmentInfo
  ) {
    this.environment = environment;
    this.commandHandler = new CoreCommandHandler(this);
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper, this.environment);
    this.middlewareManager = new MiddlewareManager();
  }

  /**
   * Gets the current environment information
   */
  getEnvironment(): EnvironmentInfo {
    return this.environment;
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
    this._eventHandler = createEventHandler(this.commandHandler, this.eventMapper, this.environment);
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
   * Sets the current state of the flow
   * @param state State to set
   */
  setState(state: FlowState): void {
    this.modelAdapter.setNodes(state.nodes);
    this.modelAdapter.setEdges(state.edges);
    this.modelAdapter.setMetadata(state.metadata);
  }

  /**
   * Applies an update to the flow state
   * @param state Partial state to apply
   * @param modelActionType Type of model action to apply
   */
  applyUpdate(state: Partial<FlowState>, modelActionType: ModelActionType): void {
    const initialState = this.getState();
    const updatedState = { ...initialState, ...state };
    const finalState = this.middlewareManager.execute(initialState, updatedState, modelActionType);
    this.setState(finalState);
  }
}
