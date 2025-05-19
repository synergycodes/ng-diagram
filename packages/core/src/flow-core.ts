import { CommandHandler } from './command-handler/command-handler';
import { InputEventHandler } from './input-event-handler/input-event-handler';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import type { EnvironmentInfo } from './types/environment.interface';
import type { EventMapper } from './types/event-mapper.interface';
import type { Event } from './types/event.interface';
import type { FlowState, Middleware, ModelActionType } from './types/middleware.interface';
import type { ModelAdapter } from './types/model-adapter.interface';
import type { Renderer } from './types/renderer.interface';

export class FlowCore {
  private _model: ModelAdapter;
  readonly commandHandler: CommandHandler;
  readonly inputEventHandler: InputEventHandler;
  readonly middlewareManager: MiddlewareManager;
  readonly environment: EnvironmentInfo;

  constructor(
    modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    environment: EnvironmentInfo,
    middlewares?: Middleware[]
  ) {
    this._model = modelAdapter;
    this.environment = environment;
    this.commandHandler = new CommandHandler(this);
    this.inputEventHandler = new InputEventHandler(this);
    this.middlewareManager = new MiddlewareManager(middlewares);
    this.init();
  }

  /**
   * Sets the new model and runs the init process
   * @param model Model
   */
  set model(model: ModelAdapter) {
    this._model = model;
    this.init();
  }

  /**
   * Gets the current model that flow core is using
   */
  get model(): ModelAdapter {
    return this._model;
  }

  /**
   * Gets the current environment information
   */
  getEnvironment(): EnvironmentInfo {
    return this.environment;
  }

  /**
   * Registers a new event handler
   * @param handler Handler to register
   */
  registerEventsHandler(handler: (event: Event) => void): void {
    this.eventMapper.register((event) => handler(event));
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware to register
   * @returns Function to unregister the middleware
   */
  registerMiddleware(middleware: Middleware): () => void {
    return this.middlewareManager.register(middleware);
  }

  /**
   * Unregisters a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregisterMiddleware(name: string): void {
    this.middlewareManager.unregister(name);
  }

  /**
   * Gets the current state of the flow
   */
  getState(): FlowState {
    return {
      nodes: this.model.getNodes(),
      edges: this.model.getEdges(),
      metadata: this.model.getMetadata(),
    };
  }

  /**
   * Sets the current state of the flow
   * @param state State to set
   */
  setState(state: FlowState): void {
    this.model.setNodes(state.nodes);
    this.model.setEdges(state.edges);
    this.model.setMetadata(state.metadata);
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

  /**
   * Converts a client position to a flow position
   * @param clientPosition Client position
   * @returns { x: number, y: number } Flow position
   */
  clientToFlowPosition(clientPosition: { x: number; y: number }): { x: number; y: number } {
    const { x: viewportX, y: viewportY, scale } = this.model.getMetadata().viewport;
    return {
      x: (clientPosition.x - viewportX) / scale,
      y: (clientPosition.y - viewportY) / scale,
    };
  }

  /**
   * Converts a flow position to a client position
   * @param flowPosition Flow position
   * @returns { x: number, y: number } Client position
   */
  flowToClientPosition(flowPosition: { x: number; y: number }): { x: number; y: number } {
    const { x: viewportX, y: viewportY, scale } = this.model.getMetadata().viewport;
    return {
      x: flowPosition.x * scale + viewportX,
      y: flowPosition.y * scale + viewportY,
    };
  }

  /**
   * Starts listening to model changes and emits init command
   */
  private init() {
    this.model.onChange(() => this.render());
    this.commandHandler.emit('init');
  }

  /**
   * Renders the flow
   */
  private render(): void {
    const { nodes, edges, metadata } = this.getState();
    const finalEdges = metadata.temporaryEdge ? [...edges, metadata.temporaryEdge] : edges;
    this.renderer.draw(nodes, finalEdges, metadata.viewport);
  }
}
