import { inject, Injectable } from '@angular/core';
import {
  ActionState,
  EdgeRouting,
  EnvironmentInfo,
  FlowCore,
  Metadata,
  Middleware,
  MiddlewareChain,
  MiddlewareConfigKeys,
  MiddlewaresConfigFromMiddlewares,
  ModelActionType,
  Point,
  TransactionCallback,
  TransactionResult,
} from '@angularflow/core';
import { FlowCoreProviderService } from '../services/flow-core-provider/flow-core-provider.service';

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
   * Returns whether the diagram is initialized
   */
  isInitialized = this.flowCoreProvider.isInitialized;

  /**
   * Returns the current metadata
   */
  getMetadata(): Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>> {
    return this.flowCore.model.getMetadata();
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
  unregisterMiddleware(name: MiddlewareConfigKeys<TMiddlewares>): void {
    return this.flowCore.unregisterMiddleware(name);
  }

  /**
   * Updates the configuration of a middleware
   * @param name Name of the middleware to update
   * @param config Config of the middleware to update
   */
  updateMiddlewareConfig<TName extends MiddlewareConfigKeys<TMiddlewares>>(
    name: TName,
    config: TMetadata['middlewaresConfig'][TName]
  ) {
    this.flowCore.updateMiddlewareConfig(name, config);
  }

  /**
   * Registers a custom routing implementation
   * @param routing Routing implementation to register
   * @example
   * const customRouting: Routing = {
   *   name: 'custom',
   *   computePoints: (source, target) => [...],
   *   computeSvgPath: (points) => '...'
   * };
   * ngDiagramService.registerRouting(customRouting);
   */
  registerRouting(routing: EdgeRouting): void {
    this.flowCore.edgeRoutingManager.registerRouting(routing);
  }

  /**
   * Unregisters a routing implementation
   * @param name Name of the routing to unregister
   */
  unregisterRouting(name: string): void {
    this.flowCore.edgeRoutingManager.unregisterRouting(name);
  }

  /**
   * Gets all registered routing names
   * @returns Array of registered routing names
   */
  getRegisteredRoutings(): string[] {
    return this.flowCore.edgeRoutingManager.getRegisteredRoutings();
  }

  /**
   * Sets the default routing to use when not specified on edges
   * @param name Name of the routing to set as default
   */
  setDefaultRouting(name: string): void {
    this.flowCore.edgeRoutingManager.setDefaultRouting(name);
  }

  /**
   * Gets the current default routing name
   * @returns Name of the default routing
   */
  getDefaultRouting(): string {
    return this.flowCore.edgeRoutingManager.getDefaultRouting();
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

  /**
   * Converts a client position to a flow position
   * @param clientPosition Client position to convert
   * @returns Flow position
   */
  clientToFlowPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowPosition(clientPosition);
  }

  /**
   * Converts a flow position to a client position
   * @param flowPosition Flow position to convert
   * @returns Client position
   */
  flowToClientPosition(flowPosition: Point): Point {
    return this.flowCore.flowToClientPosition(flowPosition);
  }

  /**
   * Converts a client position to a position relative to the flow viewport
   * @param clientPosition Client position
   * @returns position on the flow viewport
   */
  clientToFlowViewportPosition(clientPosition: Point): Point {
    return this.flowCore.clientToFlowViewportPosition(clientPosition);
  }
}
