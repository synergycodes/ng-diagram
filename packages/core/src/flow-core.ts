import { CommandHandler } from './command-handler/command-handler';
import { InitializationGuard } from './initialization-guard/initialization-guard';
import { InputEventHandler } from './input-event-handler/input-event-handler';
import { _NEW_InputEventsBus } from './input-events/input-events-bus';
import { __NEW__InputEventHandler } from './input-events/new__input-events.handler';
import { InternalUpdater } from './internal-updater/internal-updater';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { ModelLookup } from './model-lookup/model-lookup';
import { SpatialHash } from './spatial-hash/spatial-hash';
import { getNearestNodeInRange, getNearestPortInRange, getNodesInRange } from './spatial-hash/utils';
import type {
  __OLD__InputEvent,
  Edge,
  EnvironmentInfo,
  EventMapper,
  FlowState,
  FlowStateUpdate,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewareConfigKeys,
  MiddlewaresConfigFromMiddlewares,
  ModelActionType,
  ModelAdapter,
  Node,
  Port,
  Renderer,
} from './types';

export class FlowCore<
  TMiddlewares extends MiddlewareChain = [],
  TMetadata extends Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>> = Metadata<
    MiddlewaresConfigFromMiddlewares<TMiddlewares>
  >,
> {
  private _model: ModelAdapter<TMetadata>;
  readonly commandHandler: CommandHandler;
  readonly inputEventHandler: InputEventHandler;
  readonly __new__inputEventHandler: __NEW__InputEventHandler;
  readonly middlewareManager: MiddlewareManager<TMiddlewares, TMetadata>;
  readonly environment: EnvironmentInfo;
  readonly spatialHash: SpatialHash;
  readonly initializationGuard: InitializationGuard;
  readonly internalUpdater: InternalUpdater;
  readonly modelLookup: ModelLookup;

  constructor(
    modelAdapter: ModelAdapter<TMetadata>,
    private readonly renderer: Renderer,
    private readonly eventMapper: EventMapper,
    public readonly __new__eventBus: _NEW_InputEventsBus,
    environment: EnvironmentInfo,
    middlewares?: TMiddlewares
  ) {
    this._model = modelAdapter;
    this.environment = environment;
    this.commandHandler = new CommandHandler(this);
    this.inputEventHandler = new InputEventHandler(this);
    this.__new__inputEventHandler = new __NEW__InputEventHandler(this); // __NEW__InputEventHandler
    this.spatialHash = new SpatialHash();
    this.initializationGuard = new InitializationGuard(this);
    this.internalUpdater = new InternalUpdater(this);
    this.modelLookup = new ModelLookup(this);
    this.middlewareManager = new MiddlewareManager<TMiddlewares, TMetadata>(this, middlewares);

    this.init();
  }

  /**
   * Starts listening to model changes and emits init command
   */
  private init() {
    this.render();
    this.initializationGuard.start(() => {
      this.model.onChange((state) => {
        this.spatialHash.process(state.nodes);
        this.render();
      });
      this.commandHandler.emit('init');
    });
  }

  /**
   * Sets the new model and runs the init process
   * @param model Model
   */
  set model(model: ModelAdapter<TMetadata>) {
    this._model = model;
    this.init();
  }

  /**
   * Gets the current model that flow core is using
   */
  get model(): ModelAdapter<TMetadata> {
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
   * @deprecated This looks like internal handler method
   */
  registerEventsHandler(handler: (event: __OLD__InputEvent) => void): void {
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
   * Unregister a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregisterMiddleware(name: MiddlewareConfigKeys<TMiddlewares>): void {
    this.middlewareManager.unregister(name);
  }

  /**
   * Updates the configuration of a middleware
   * @param name Name of the middleware to update
   * @param metadata Metadata to update
   */
  updateMiddlewareConfig<TName extends MiddlewareConfigKeys<TMiddlewares>>(
    name: TName,
    config: TMetadata['middlewaresConfig'][TName]
  ): void {
    this.middlewareManager.applyMiddlewareConfig(name, config);
  }

  /**
   * Gets the current state of the flow
   */
  getState(): FlowState<TMetadata> {
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
  setState(state: FlowState<TMetadata>): void {
    this.model.setNodes(state.nodes);
    this.model.setEdges(state.edges);
    this.model.setMetadata(state.metadata);
    // We desynchronize the model lookup to force a re-sync of the model lookup maps on the fly
    this.modelLookup.desynchronize();
  }

  /**
   * Applies an update to the flow state
   * @param stateUpdate Partial state to apply
   * @param modelActionType Type of model action to apply
   */
  async applyUpdate(stateUpdate: FlowStateUpdate, modelActionType: ModelActionType): Promise<void> {
    const finalState = await this.middlewareManager.execute(this.getState(), stateUpdate, modelActionType);
    if (finalState) {
      this.setState(finalState);
    }
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
   * Renders the flow
   */
  private render(): void {
    const { nodes, edges, metadata } = this.getState();
    const finalEdges = metadata.temporaryEdge ? [...edges, metadata.temporaryEdge] : edges;
    this.renderer.draw(nodes, finalEdges, metadata.viewport);
  }

  /**
   * Gets a node by id
   * @param nodeId Node id
   * @returns Node
   */
  getNodeById(nodeId: string): Node | null {
    return this.modelLookup.getNodeById(nodeId);
  }

  /**
   * Gets an edge by id
   * @param edgeId Edge id
   * @returns Edge
   */
  getEdgeById(edgeId: string): Edge | null {
    return this.modelLookup.getEdgeById(edgeId);
  }

  /**
   * Gets all nodes in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Array of nodes in range
   */
  getNodesInRange(point: { x: number; y: number }, range: number): Node[] {
    return getNodesInRange(this, point, range);
  }

  /**
   * Gets the nearest node in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest node in range or null
   */
  getNearestNodeInRange(point: { x: number; y: number }, range: number): Node | null {
    return getNearestNodeInRange(this, point, range);
  }

  /**
   * Gets the nearest port in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest port in range or null
   */
  getNearestPortInRange(point: { x: number; y: number }, range: number): Port | null {
    return getNearestPortInRange(this, point, range);
  }

  /**
   * Sets the layout
   */
  layout(layout: 'Tree') {
    switch (layout) {
      case 'Tree':
        this.applyUpdate({}, 'treeLayout');
        break;
      default:
        throw new Error(`The "${layout}" layout does not exist.`);
    }
  }
}
