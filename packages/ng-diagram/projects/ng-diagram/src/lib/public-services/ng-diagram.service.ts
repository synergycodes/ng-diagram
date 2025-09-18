import { inject, Injectable } from '@angular/core';
import {
  ActionState,
  DiagramEventMap,
  EdgeRouting,
  EnvironmentInfo,
  EventListener,
  Middleware,
  ModelActionType,
  Node,
  TransactionCallback,
  TransactionResult,
  UnsubscribeFn,
} from '../../core/src';
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
   * Call this method to start linking from your custom logic
   * @param node The node from which the linking starts
   * @param portId The port ID from which the linking starts
   */
  startLinking(node: Node, portId: string) {
    this.manualLinkingService.startLinking(node, portId);
  }

  /**
   * Add an event listener for a diagram event
   * @param event The event name
   * @param callback The callback to invoke when the event is emitted
   * @returns A function to unsubscribe
   * @example
   * const unsubscribe = ngDiagramService.addEventListener('selectionChanged', (event) => {
   *   console.log('Selection changed', event.selectedNodes);
   * });
   */
  addEventListener<K extends keyof DiagramEventMap>(
    event: K,
    callback: EventListener<DiagramEventMap[K]>
  ): UnsubscribeFn {
    return this.flowCore.eventManager.on(event, callback);
  }

  /**
   * Add an event listener that will only fire once
   * @param event The event name
   * @param callback The callback to invoke when the event is emitted
   * @returns A function to unsubscribe
   * @example
   * ngDiagramService.addEventListenerOnce('diagramInit', (event) => {
   *   console.log('Diagram initialized', event);
   * });
   */
  addEventListenerOnce<K extends keyof DiagramEventMap>(
    event: K,
    callback: EventListener<DiagramEventMap[K]>
  ): UnsubscribeFn {
    return this.flowCore.eventManager.once(event, callback);
  }

  /**
   * Remove an event listener
   * @param event The event name
   * @param callback Optional specific callback to remove
   * @example
   * // Remove all listeners for an event
   * ngDiagramService.removeEventListener('selectionChanged');
   *
   * // Remove a specific listener
   * ngDiagramService.removeEventListener('selectionChanged', myCallback);
   */
  removeEventListener<K extends keyof DiagramEventMap>(event: K, callback?: EventListener<DiagramEventMap[K]>): void {
    this.flowCore.eventManager.off(event, callback);
  }

  /**
   * Remove all event listeners
   * @example
   * ngDiagramService.removeAllEventListeners();
   */
  removeAllEventListeners(): void {
    this.flowCore.eventManager.offAll();
  }

  /**
   * Enable or disable event emissions
   * @param enabled Whether events should be emitted
   * @example
   * // Disable all events
   * ngDiagramService.setEventsEnabled(false);
   *
   * // Re-enable events
   * ngDiagramService.setEventsEnabled(true);
   */
  setEventsEnabled(enabled: boolean): void {
    this.flowCore.eventManager.setEnabled(enabled);
  }

  /**
   * Check if event emissions are enabled
   * @returns True if events are enabled
   */
  areEventsEnabled(): boolean {
    return this.flowCore.eventManager.isEnabled();
  }

  /**
   * Check if there are any listeners for an event
   * @param event The event name
   * @returns True if there are listeners
   * @example
   * if (ngDiagramService.hasEventListeners('selectionChanged')) {
   *   // There are listeners for selection changes
   * }
   */
  hasEventListeners(event: keyof DiagramEventMap): boolean {
    return this.flowCore.eventManager.hasListeners(event);
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
