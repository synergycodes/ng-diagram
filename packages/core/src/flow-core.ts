import { CommandHandler } from './command-handler/command-handler';
import { defaultFlowConfig } from './flow-config/default-flow-config';
import { InputEventsRouter } from './input-events';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { loggerMiddleware } from './middleware-manager/middlewares';
import { ModelLookup } from './model-lookup/model-lookup';
import { PortBatchProcessor } from './port-batch-processor/port-batch-processor';
import { SpatialHash } from './spatial-hash/spatial-hash';
import { getNearestNodeInRange, getNearestPortInRange, getNodesInRange } from './spatial-hash/utils';
import { TransactionManager } from './transaction-manager/transaction-manager';
import { TransactionCallback, TransactionResult } from './transaction-manager/transaction.types';
import type {
  DeepPartial,
  Edge,
  EnvironmentInfo,
  FlowConfig,
  FlowState,
  FlowStateUpdate,
  LooseAutocomplete,
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
import { InitUpdater } from './updater/init-updater/init-updater';
import { InternalUpdater } from './updater/internal-updater/internal-updater';
import { Updater } from './updater/updater.interface';
import { deepMerge, Semaphore } from './utils';

export class FlowCore<
  TMiddlewares extends MiddlewareChain = [],
  TMetadata extends Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>> = Metadata<
    MiddlewaresConfigFromMiddlewares<TMiddlewares>
  >,
> {
  private _model: ModelAdapter<TMetadata>;
  private readonly initUpdater: InitUpdater;
  private readonly internalUpdater: InternalUpdater;
  private readonly updateSemaphore = new Semaphore(1);

  readonly commandHandler: CommandHandler;
  readonly middlewareManager: MiddlewareManager<TMiddlewares, TMetadata>;
  readonly environment: EnvironmentInfo;
  readonly spatialHash: SpatialHash;
  readonly modelLookup: ModelLookup;
  readonly transactionManager: TransactionManager;
  readonly portBatchProcessor: PortBatchProcessor;
  readonly config: FlowConfig;

  readonly getFlowOffset: () => { x: number; y: number };

  constructor(
    modelAdapter: ModelAdapter<TMetadata>,
    private readonly renderer: Renderer,
    public readonly inputEventsRouter: InputEventsRouter,
    environment: EnvironmentInfo,
    middlewares?: TMiddlewares,
    getFlowOffset?: () => { x: number; y: number },
    config: DeepPartial<FlowConfig> = {}
  ) {
    this._model = modelAdapter;
    this.environment = environment;
    this.commandHandler = new CommandHandler(this);
    this.spatialHash = new SpatialHash();
    this.initUpdater = new InitUpdater(this);
    this.internalUpdater = new InternalUpdater(this);
    this.modelLookup = new ModelLookup(this);
    this.middlewareManager = new MiddlewareManager<TMiddlewares, TMetadata>(this, middlewares);
    this.transactionManager = new TransactionManager(this);
    this.portBatchProcessor = new PortBatchProcessor();
    this.getFlowOffset = getFlowOffset || (() => ({ x: 0, y: 0 }));
    this.config = deepMerge(defaultFlowConfig, config);

    this.inputEventsRouter.registerDefaultCallbacks(this);

    this.init();
  }

  destroy() {
    this.model.destroy();
  }

  /**
   * Starts listening to model changes and emits init command
   */
  private async init() {
    this.render();

    await this.initUpdater.start();

    this.model.onChange((state) => {
      this.spatialHash.process(state.nodes);
      this.render();
    });

    this.commandHandler.emit('init');
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
   * Executes a function within a transaction context.
   * All state updates within the callback are batched and applied atomically.
   *
   * @example
   * // Simple transaction
   * await flowCore.transaction(async (tx) => {
   *   await tx.emit('addNode', { node });
   *   await tx.emit('selectNode', { nodeId: node.id });
   * });
   *
   * // Named transaction
   * await flowCore.transaction('batchUpdate', async (tx) => {
   *   await tx.emit('updateNodes', { nodes });
   *   if (error) {
   *     tx.rollback(); // Discard all changes
   *   }
   * });
   *
   * // With savepoints
   * await flowCore.transaction(async (tx) => {
   *   await tx.emit('step1', {});
   *   tx.savepoint('afterStep1');
   *
   *   await tx.emit('step2', {});
   *   if (step2Failed) {
   *     tx.rollbackTo('afterStep1');
   *   }
   * });
   */
  async transaction(callback: TransactionCallback): Promise<TransactionResult>;
  async transaction(name: ModelActionType, callback: TransactionCallback): Promise<TransactionResult>;
  async transaction(
    nameOrCallback: ModelActionType | TransactionCallback,
    callback?: TransactionCallback
  ): Promise<TransactionResult> {
    let results: TransactionResult;

    if (typeof nameOrCallback === 'function') {
      results = await this.transactionManager.transaction(nameOrCallback);
    } else {
      if (!callback) {
        throw new Error('Callback is required when transaction name is provided');
      }
      results = await this.transactionManager.transaction(nameOrCallback, callback);
    }

    if (results.commandsCount > 0) {
      await this.applyUpdate(results.results, nameOrCallback as ModelActionType);
    }

    return results;
  }

  /**
   * Applies an update to the flow state
   * @param stateUpdate Partial state to apply
   * @param modelActionType Type of model action to apply
   */
  async applyUpdate(stateUpdate: FlowStateUpdate, modelActionType: LooseAutocomplete<ModelActionType>): Promise<void> {
    if (this.transactionManager.isActive()) {
      this.transactionManager.queueUpdate(stateUpdate, modelActionType);
      return;
    }

    // Acquire semaphore to ensure atomic updates
    await this.updateSemaphore.acquire();

    try {
      // Get the current state - guaranteed to be fresh since we hold the lock
      const currentState = this.getState();
      const finalState = await this.middlewareManager.execute(currentState, stateUpdate, modelActionType);

      if (finalState) {
        this.setState(finalState);
      }
    } finally {
      // Always release the semaphore, even if an error occurs
      this.updateSemaphore.release();
    }
  }

  /**
   * Converts a client position to a flow position
   * @param clientPosition Client position
   * @returns { x: number, y: number } Flow position
   */
  clientToFlowPosition(clientPosition: { x: number; y: number }): { x: number; y: number } {
    const { x: viewportX, y: viewportY, scale } = this.model.getMetadata().viewport;
    const { x: flowOffsetX, y: flowOffsetY } = this.getFlowOffset();
    return {
      x: (clientPosition.x - viewportX - flowOffsetX) / scale,
      y: (clientPosition.y - viewportY - flowOffsetY) / scale,
    };
  }

  /**
   * Converts a flow position to a client position
   * @param flowPosition Flow position
   * @returns { x: number, y: number } Client position
   */
  flowToClientPosition(flowPosition: { x: number; y: number }): { x: number; y: number } {
    const { x: viewportX, y: viewportY, scale } = this.model.getMetadata().viewport;
    const { x: flowOffsetX, y: flowOffsetY } = this.getFlowOffset();
    return {
      x: flowPosition.x * scale + viewportX + flowOffsetX,
      y: flowPosition.y * scale + viewportY + flowOffsetY,
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

  /**
   * Returns the current zoom scale
   */
  getScale() {
    return this.model.getMetadata().viewport.scale;
  }

  get updater(): Updater {
    if (!this.initUpdater.isInitialized) {
      return this.initUpdater;
    }

    return this.internalUpdater;
  }

  setDebugMode(debugMode: boolean): void {
    if (debugMode) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).flowCore = this;

      if (!this.middlewareManager.isRegistered(loggerMiddleware.name as MiddlewareConfigKeys<TMiddlewares>)) {
        this.registerMiddleware(loggerMiddleware);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).flowCore;
      this.unregisterMiddleware(loggerMiddleware.name as MiddlewareConfigKeys<TMiddlewares>);
    }
  }
}
