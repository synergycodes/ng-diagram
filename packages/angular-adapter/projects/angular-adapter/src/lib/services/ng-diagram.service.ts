import { computed, inject, Injectable } from '@angular/core';
import {
  ActionState,
  Edge,
  EnvironmentInfo,
  FlowCore,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewareConfigKeys,
  MiddlewaresConfigFromMiddlewares,
  ModelActionType,
  Node,
  Port,
  TransactionCallback,
  TransactionResult,
} from '@angularflow/core';
import { FlowCoreProviderService } from './flow-core-provider/flow-core-provider.service';

// Type alias to work around Angular compiler issue with generic MiddlewareConfigKeys
type MiddlewareConfigKeysType<T extends MiddlewareChain> = keyof MiddlewaresConfigFromMiddlewares<T> & string;

@Injectable()
export class NgDiagramService<
  TMiddlewares extends MiddlewareChain = [],
  TMetadata extends Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>> = Metadata<
    MiddlewaresConfigFromMiddlewares<TMiddlewares>
  >,
> {
  private readonly flowCoreProvider = inject(FlowCoreProviderService<TMiddlewares>);

  private get flowCore(): FlowCore<TMiddlewares> {
    return this.flowCoreProvider.provide();
  }

  /**
   * Returns the current model that NgDiagram instance is using
   */
  getModel() {
    return this.flowCore.model;
  }

  /**
   * Returns diagram's command system for programmatic control.
   *
   * The command handler allows you to:
   * - Emit system commands (select, move, copy, paste, etc.)
   * - Listen for command events
   * - Programmatically control diagram behavior
   *
   * Use this for implementing custom UI controls
   * or integrating with external systems that need to control the diagram.
   */
  getCommandHandler() {
    return this.flowCore.commandHandler;
  }
  /**
   * Returns the current zoom scale
   */
  getScale() {
    return computed(() => this.flowCore.getScale());
  }

  /**
   * Sets the layout
   */
  layout(layout: 'Tree') {
    return this.flowCore.layout(layout);
  }

  /**
   * Gets the current environment information
   */
  getEnvironment(): EnvironmentInfo {
    return this.flowCore.getEnvironment();
  }

  /**
   * Returns the current action state (readonly)
   * This includes information about ongoing actions like resizing and linking
   */
  getActionState(): Readonly<ActionState> {
    return this.flowCore.actionStateManager.getState();
  }

  /**
   * Registers a new middleware in the chain
   * @param middleware Middleware to register
   * @returns Function to unregister the middleware
   */
  registerMiddleware(middleware: Middleware): () => void {
    return this.flowCore.registerMiddleware(middleware);
  }

  /**
   * Unregister a middleware from the chain
   * @param name Name of the middleware to unregister
   */
  unregisterMiddleware(name: MiddlewareConfigKeysType<TMiddlewares>): void {
    return this.flowCore.unregisterMiddleware(name);
  }

  /**
   * Updates the configuration of a middleware
   * @param name Name of the middleware to update
   * @param metadata Metadata to update
   */
  updateMiddlewareConfig<TName extends MiddlewareConfigKeysType<TMiddlewares>>(
    name: TName,
    config: TMetadata['middlewaresConfig'][TName]
  ) {
    this.flowCore.updateMiddlewareConfig(name, config);
  }

  /**
   * Gets a node by id
   * @param nodeId Node id
   * @returns Node
   */
  getNodeById(nodeId: string): Node | null {
    return this.flowCore.getNodeById(nodeId);
  }

  /**
   * Gets an edge by id
   * @param edgeId Edge id
   * @returns Edge
   */
  getEdgeById(edgeId: string): Edge | null {
    return this.flowCore.getEdgeById(edgeId);
  }

  /**
   * Gets all nodes in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Array of nodes in range
   */
  getNodesInRange(point: { x: number; y: number }, range: number): Node[] {
    return this.flowCore.getNodesInRange(point, range);
  }

  /**
   * Gets the nearest node in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest node in range or null
   */
  getNearestNodeInRange(point: { x: number; y: number }, range: number): Node | null {
    return this.flowCore.getNearestNodeInRange(point, range);
  }

  /**
   * Gets the nearest port in a range from a point
   * @param point Point to check from
   * @param range Range to check in
   * @returns Nearest port in range or null
   */
  getNearestPortInRange(point: { x: number; y: number }, range: number): Port | null {
    return this.flowCore.getNearestPortInRange(point, range);
  }

  /**
   * Executes a function within a transaction context.
   * All state updates within the callback are batched and applied atomically.
   *
   * @example
   * // Simple transaction
   * await ngDiagramService.transaction(async (tx) => {
   *   await tx.emit('addNode', { node });
   *   await tx.emit('selectNode', { nodeId: node.id });
   * });
   *
   * // Named transaction
   * await ngDiagramService.transaction('batchUpdate', async (tx) => {
   *   await tx.emit('updateNodes', { nodes });
   *   if (error) {
   *     tx.rollback(); // Discard all changes
   *   }
   * });
   *
   * // With savepoints
   * await ngDiagramService.transaction(async (tx) => {
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
    if (typeof nameOrCallback === 'function') {
      return this.flowCore.transaction(nameOrCallback);
    }

    if (!callback) {
      throw new Error('Callback is required when transaction name is provided');
    }

    return this.flowCore.transaction(nameOrCallback, callback);
  }
}
