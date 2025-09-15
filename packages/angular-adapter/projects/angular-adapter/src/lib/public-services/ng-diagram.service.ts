import { inject, Injectable } from '@angular/core';
import {
  ActionState,
  EdgeLabel,
  EdgeRouting,
  EnvironmentInfo,
  Middleware,
  ModelActionType,
  Node,
  TransactionCallback,
  TransactionResult,
} from '@angularflow/core';
import { ManualLinkingService } from '../services/input-events/manual-linking.service';
import { NgDiagramConfig } from '../types';
import { NgDiagramBaseService } from './ng-diagram-base.service';

@Injectable()
export class NgDiagramService extends NgDiagramBaseService {
  private readonly manualLinkingService = inject(ManualLinkingService);
  /**
   * Returns whether the diagram is initialized
   */
  isInitialized = this.flowCoreProvider.isInitialized;

  /**
   * Sets the layout
   */
  layout(layout: 'tree') {
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
   * Returns the current configuration (readonly).
   * The returned object cannot be modified directly —
   * use {@link updateConfig} to make changes.
   */
  getConfig(): Readonly<NgDiagramConfig> {
    return this.flowCore.config;
  }

  /**
   * Updates the current configuration.
   *
   * @param config Partial configuration object containing properties to update.
   */
  updateConfig(config: Partial<NgDiagramConfig>) {
    this.flowCore.updateConfig(config);
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
  unregisterMiddleware(name: string): void {
    return this.flowCore.unregisterMiddleware(name);
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
   * Adds labels to an edge.
   * @param edgeId The ID of the edge to add labels to.
   * @param labels The labels to add to the edge.
   */
  addEdgeLabels(edgeId: string, labels: EdgeLabel[]) {
    this.flowCore.commandHandler.emit('addEdgeLabels', { edgeId, labels });
  }

  /**
   * Updates a label on an edge.
   * @param edgeId The ID of the edge to update the label on.
   * @param labelId The ID of the label to update.
   * @param labelChanges The changes to apply to the label.
   */
  updateEdgeLabel(edgeId: string, labelId: string, labelChanges: Partial<EdgeLabel>) {
    this.flowCore.commandHandler.emit('updateEdgeLabel', { edgeId, labelId, labelChanges });
  }

  /**
   * Deletes labels from an edge.
   * @param edgeId The ID of the edge to delete labels from.
   * @param labelIds The IDs of the labels to delete.
   */
  deleteEdgeLabels(edgeId: string, labelIds: string[]) {
    this.flowCore.commandHandler.emit('deleteEdgeLabels', { edgeId, labelIds });
  }

  /**
   * Call this method to start linking from your custom logic
   * @param node The node from which the linking starts
   * @param portId The port ID from which the linking starts
   */
  startLinking(node: Node, portId: string) {
    this.manualLinkingService.startLinking(node, portId);
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
