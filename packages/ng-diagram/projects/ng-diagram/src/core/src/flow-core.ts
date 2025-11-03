import { ActionStateManager } from './action-state-manager/action-state-manager';
import { CommandHandler } from './command-handler/command-handler';
import { EdgeRoutingManager } from './edge-routing-manager';
import { EventManager } from './event-manager';
import { createFlowConfig } from './flow-config/default-flow-config';
import { InputEventsRouter } from './input-events';
import { LabelBatchProcessor } from './label-batch-processor/label-batch-processor';
import { MiddlewareManager } from './middleware-manager/middleware-manager';
import { loggerMiddleware } from './middleware-manager/middlewares';
import { ModelLookup } from './model-lookup/model-lookup';
import { PortBatchProcessor } from './port-batch-processor/port-batch-processor';
import { SpatialHash } from './spatial-hash/spatial-hash';
import { getNearestNodeInRange, getNearestPortInRange, getNodesInRange } from './spatial-hash/utils';
import { TransactionManager } from './transaction-manager/transaction-manager';
import type {
  DeepPartial,
  Edge,
  EnvironmentInfo,
  FlowConfig,
  FlowState,
  FlowStateUpdate,
  GroupNode,
  LooseAutocomplete,
  Middleware,
  MiddlewareChain,
  ModelActionType,
  ModelAdapter,
  Node,
  Point,
  Port,
  Renderer,
} from './types';
import { TransactionCallback, TransactionResult } from './types/transaction.interface';
import { InitUpdater } from './updater/init-updater/init-updater';
import { InternalUpdater } from './updater/internal-updater/internal-updater';
import { Updater } from './updater/updater.interface';
import { deepMerge, Semaphore } from './utils';

export class FlowCore {
  private _model: ModelAdapter;
  private _config: FlowConfig;

  private readonly initUpdater: InitUpdater;
  readonly internalUpdater: InternalUpdater;
  private readonly updateSemaphore = new Semaphore(1);

  readonly commandHandler: CommandHandler;
  readonly middlewareManager: MiddlewareManager;
  readonly spatialHash: SpatialHash;
  readonly modelLookup: ModelLookup;
  readonly transactionManager: TransactionManager;
  readonly portBatchProcessor: PortBatchProcessor;
  readonly labelBatchProcessor: LabelBatchProcessor;
  readonly actionStateManager: ActionStateManager;
  readonly edgeRoutingManager: EdgeRoutingManager;
  readonly eventManager: EventManager;

  readonly getFlowOffset: () => Point;

  constructor(
    modelAdapter: ModelAdapter,
    private readonly renderer: Renderer,
    public readonly inputEventsRouter: InputEventsRouter,
    public readonly environment: EnvironmentInfo,
    middlewares?: MiddlewareChain,
    getFlowOffset?: () => Point,
    config: DeepPartial<FlowConfig> = {}
  ) {
    this._model = modelAdapter;
    this._config = createFlowConfig(config, this);
    this.environment = environment;
    this.commandHandler = new CommandHandler(this);
    this.spatialHash = new SpatialHash();
    this.initUpdater = new InitUpdater(this);
    this.internalUpdater = new InternalUpdater(this);
    this.modelLookup = new ModelLookup(this);
    this.middlewareManager = new MiddlewareManager(this, middlewares);
    this.transactionManager = new TransactionManager(this);
    this.eventManager = new EventManager();
    this.actionStateManager = new ActionStateManager(this.eventManager);
    this.portBatchProcessor = new PortBatchProcessor();
    this.labelBatchProcessor = new LabelBatchProcessor();
    this.edgeRoutingManager = new EdgeRoutingManager(
      this.config.edgeRouting.defaultRouting,
      () => this.config.edgeRouting || {}
    );
    this.getFlowOffset = getFlowOffset || (() => ({ x: 0, y: 0 }));

    this.inputEventsRouter.registerDefaultCallbacks(this);

    this.init();
  }

  destroy() {
    this.eventManager.offAll();
    this.model.destroy();
  }

  /**
   * Starts listening to model changes and emits init command
   */
  private init() {
    this.render();

    this.model.onChange((state) => {
      this.spatialHash.process(state.nodes);
      this.modelLookup.desynchronize();
      this.render();
    });

    this.initUpdater.start(async () => {
      await this.commandHandler.emit('init');
    });
  }

  /**
   * Sets the new model and runs the init process
   * @param model Model
   */
  private set model(model: ModelAdapter) {
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

  get config(): FlowConfig {
    return this._config;
  }

  updateConfig(updatedConfig: DeepPartial<FlowConfig>) {
    this._config = deepMerge(this._config, updatedConfig);
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
    this.model.updateNodes(state.nodes);
    this.model.updateEdges(state.edges);
    this.model.updateMetadata(state.metadata);
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
        this.eventManager.flushDeferredEmits();
      } else {
        this.eventManager.clearDeferredEmits();
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
  clientToFlowPosition(clientPosition: Point): Point {
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
  flowToClientPosition(flowPosition: Point): Point {
    const { x: viewportX, y: viewportY, scale } = this.model.getMetadata().viewport;
    const { x: flowOffsetX, y: flowOffsetY } = this.getFlowOffset();
    return {
      x: flowPosition.x * scale + viewportX + flowOffsetX,
      y: flowPosition.y * scale + viewportY + flowOffsetY,
    };
  }

  /**
   * Converts a client position to a position relative to the flow viewport
   * @param clientPosition Client position
   * @returns position on the flow viewport
   */
  clientToFlowViewportPosition(clientPosition: Point): Point {
    const { x: flowOffsetX, y: flowOffsetY } = this.getFlowOffset();
    return {
      x: clientPosition.x - flowOffsetX,
      y: clientPosition.y - flowOffsetY,
    };
  }

  /**
   * Renders the flow
   */
  private render(): void {
    const { nodes, edges, metadata } = this.getState();
    const temporaryEdge = this.actionStateManager.linking?.temporaryEdge;
    const finalEdges = temporaryEdge && temporaryEdge.temporary ? [...edges, temporaryEdge] : edges;
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
  getNodesInRange(point: Point, range: number): Node[] {
    return getNodesInRange(this, point, range);
  }

  /**
   * Gets the nearest node in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest node in range or null
   */
  getNearestNodeInRange(point: Point, range: number): Node | null {
    return getNearestNodeInRange(this, point, range);
  }

  /**
   * Gets the nearest port in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest port in range or null
   */
  getNearestPortInRange(point: Point, range: number): Port | null {
    return getNearestPortInRange(this, point, range);
  }

  /**
   * Gets all edges connected to a node
   * @param nodeId Node id
   * @returns Array of edges where the node is either source or target
   */
  getConnectedEdges(nodeId: string): Edge[] {
    return this.modelLookup.getConnectedEdges(nodeId);
  }

  /**
   * Gets all nodes connected to a node via edges
   * @param nodeId Node id
   * @returns Array of nodes connected to the given node
   */
  getConnectedNodes(nodeId: string): Node[] {
    return this.modelLookup.getConnectedNodes(nodeId);
  }

  /**
   * Gets the source and target nodes of an edge
   * @param edgeId Edge id
   * @returns Object containing source and target nodes, or null if edge doesn't exist
   */
  getNodeEnds(edgeId: string): { source: Node; target: Node } | null {
    return this.modelLookup.getNodeEnds(edgeId);
  }

  /**
   * Gets all children nodes for a given group node id
   * @param groupId group node id
   * @returns Array of child nodes
   */
  getChildren(groupId: string): Node[] {
    return this.modelLookup.getChildren(groupId);
  }

  /**
   * Gets all nested children (descendants) of a group node
   * @param groupId Group node id
   * @returns Array of all descendant nodes (children, grandchildren, etc.)
   */
  getChildrenNested(groupId: string): Node[] {
    return this.modelLookup.getAllDescendants(groupId);
  }

  /**
   * Checks if a node is a nested child (descendant) of a group node
   * @param nodeId Node id
   * @param groupId Group node id
   * @returns True if the node is part of the group's nested subgraph
   */
  isNestedChild(nodeId: string, groupId: string): boolean {
    return this.modelLookup.isNodeDescendantOfGroup(nodeId, groupId);
  }

  /**
   * Gets the full chain of parent group Nodes for a given nodeId.
   * @param nodeId Node id
   * @returns Array of parent group Node objects, from closest parent to farthest ancestor
   */
  getParentHierarchy(nodeId: string): GroupNode[] {
    return this.modelLookup.getParentChain(nodeId);
  }

  /**
   * Detects collision with other nodes by finding all nodes whose rectangles intersect
   * with the specified node's bounding rectangle.
   *
   * @param nodeId - The ID of the node to check for collisions
   * @returns An array of Nodes that overlap with the specified node
   */
  getOverlappingNodes(nodeId: string): Node[] {
    return this.spatialHash
      .getOverlappingNodes(nodeId)
      .map((id) => this.modelLookup.getNodeById(id))
      .filter((node): node is Node => node !== null);
  }

  /**
   * Returns the current zoom scale
   */
  getScale() {
    return this.model.getMetadata().viewport.scale;
  }

  /**
   * Returns the current viewport
   */
  getViewport() {
    return this.model.getMetadata().viewport;
  }

  get updater(): Updater {
    return this.initUpdater.isInitialized ? this.internalUpdater : this.initUpdater;
  }

  setDebugMode(debugMode: boolean): void {
    if (debugMode) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).flowCore = this;

      if (!this.middlewareManager.isRegistered(loggerMiddleware.name)) {
        this.registerMiddleware(loggerMiddleware);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).flowCore;
      this.unregisterMiddleware(loggerMiddleware.name);
    }
  }
}
