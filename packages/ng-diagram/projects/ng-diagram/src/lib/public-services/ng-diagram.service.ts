import { effect, inject, Injectable, signal, untracked } from '@angular/core';
import {
  ActionState,
  DiagramEventMap,
  EdgeRouting,
  EnvironmentInfo,
  EventListener,
  Middleware,
  Node,
  TransactionCallback,
  UnsubscribeFn,
} from '../../core/src';
import { ManualLinkingService } from '../services/input-events/manual-linking.service';
import { RendererService } from '../services/renderer/renderer.service';
import { NgDiagramConfig } from '../types';
import { NgDiagramBaseService } from './ng-diagram-base.service';

/**
 * The `NgDiagramService` provides advanced access to the diagram's core API,
 * including configuration, layout, event management, routing, transactions, and more.
 *
 * ## Example usage
 * ```typescript
 * private ngDiagramService = inject(NgDiagramService);
 *
 * // Check if diagram is initialized (reactive signal)
 * effect(() => {
 *   if (this.ngDiagramService.isInitialized()) {
 *     console.log('Diagram ready!');
 *   }
 * });
 *
 * // Access reactive config
 * const isDebugMode = this.ngDiagramService.config().debugMode;
 *
 * // Update configuration
 * this.ngDiagramService.updateConfig({ debugMode: true });
 * ```
 *
 * @category Services
 */
@Injectable()
export class NgDiagramService extends NgDiagramBaseService {
  private readonly manualLinkingService = inject(ManualLinkingService);
  private readonly renderer = inject(RendererService);

  // ==============================
  // Reactive State (Signals)
  // ==============================

  /**
   * Returns whether the diagram is fully initialized and all elements are measured.
   * This signal is set to `true` when the `diagramInit` event fires.
   */
  isInitialized = this.renderer.isInitialized.asReadonly();

  private config$ = signal<Readonly<NgDiagramConfig>>({});
  /**
   * Reactive signal that tracks the current configuration (readonly).
   * To update the configuration, use {@link updateConfig}.
   */
  readonly config = this.config$.asReadonly();

  private actionState$ = signal<Readonly<ActionState>>({});
  /**
   * Reactive signal that tracks the current action state (readonly).
   * This signal is managed internally by the diagram and updates automatically
   * when actions like resizing, rotating, or linking start/end.
   *
   * @readonly - This property cannot be modified directly.
   */
  readonly actionState = this.actionState$.asReadonly();

  constructor() {
    super();
    effect(() => {
      if (this.isInitialized()) {
        // Angular 18 backward compatibility
        untracked(() => {
          this.config$.set(this.flowCore.config);
        });
      }
    });

    effect((onCleanup) => {
      if (!this.isInitialized()) return;

      const unsubscribe = this.flowCore.eventManager.on('actionStateChanged', (event) => {
        // Angular 18 backward compatibility
        untracked(() => {
          this.actionState$.set(event.actionState);
        });
      });

      onCleanup(() => unsubscribe());
    });
  }

  // ==============================
  // Configuration
  // ==============================

  /**
   * Updates the current configuration.
   * @param config Partial configuration object containing properties to update.
   * @example
   * // Enable debug mode
   * this.ngDiagramService.updateConfig({ debugMode: true });
   */
  updateConfig(config: Partial<NgDiagramConfig>) {
    this.flowCore.updateConfig(config);
    this.config$.set(this.flowCore.config);
  }

  // ==============================
  // Queries
  // ==============================

  /**
   * Gets the current environment information.
   * @returns The environment info object.
   */
  getEnvironment(): EnvironmentInfo {
    return this.flowCore.getEnvironment();
  }

  // ==============================
  // Middleware
  // ==============================

  /**
   * Registers a new middleware in the chain.
   * @param middleware Middleware to register.
   * @returns Function to unregister the middleware.
   */
  registerMiddleware(middleware: Middleware): () => void {
    return this.flowCore.registerMiddleware(middleware);
  }

  /**
   * Unregister a middleware from the chain.
   * @param name Name of the middleware to unregister.
   */
  unregisterMiddleware(name: string): void {
    this.flowCore.unregisterMiddleware(name);
  }

  // ==============================
  // Edge Routing
  // ==============================

  /**
   * Registers a custom routing implementation.
   * @param routing Routing implementation to register.
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
   * Unregisters a routing implementation.
   * @param name Name of the routing to unregister.
   */
  unregisterRouting(name: string): void {
    this.flowCore.edgeRoutingManager.unregisterRouting(name);
  }

  /**
   * Gets all registered routing names.
   * @returns Array of registered routing names.
   */
  getRegisteredRoutings(): string[] {
    return this.flowCore.edgeRoutingManager.getRegisteredRoutings();
  }

  /**
   * Sets the default routing to use when not specified on edges.
   * @param name Name of the routing to set as default.
   */
  setDefaultRouting(name: string): void {
    this.flowCore.edgeRoutingManager.setDefaultRouting(name);
  }

  /**
   * Gets the current default routing name.
   * @returns Name of the default routing.
   */
  getDefaultRouting(): string {
    return this.flowCore.edgeRoutingManager.getDefaultRouting();
  }

  // ==============================
  // Manual Linking
  // ==============================

  /**
   * Call this method to start linking from your custom logic.
   * @param node The node from which the linking starts.
   * @param portId The port ID from which the linking starts. Creates a floating edge when undefined.
   */
  startLinking(node: Node, portId?: string) {
    this.manualLinkingService.startLinking(node, portId);
  }

  // ==============================
  // Event Management
  // ==============================

  /**
   * Add an event listener for a diagram event.
   * @param event The event name.
   * @param callback The callback to invoke when the event is emitted.
   * @returns A function to unsubscribe.
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
   * Add an event listener that will only fire once.
   * @param event The event name.
   * @param callback The callback to invoke when the event is emitted.
   * @returns A function to unsubscribe.
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
   * Remove an event listener.
   * @param event The event name.
   * @param callback Optional specific callback to remove.
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
   * Remove all event listeners.
   * @example
   * ngDiagramService.removeAllEventListeners();
   */
  removeAllEventListeners(): void {
    this.flowCore.eventManager.offAll();
  }

  /**
   * Enable or disable event emissions.
   * @param enabled Whether events should be emitted.
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
   * Check if event emissions are enabled.
   * @returns True if events are enabled.
   */
  areEventsEnabled(): boolean {
    return this.flowCore.eventManager.isEnabled();
  }

  /**
   * Check if there are any listeners for an event.
   * @param event The event name.
   * @returns True if there are listeners.
   * @example
   * if (ngDiagramService.hasEventListeners('selectionChanged')) {
   *   // There are listeners for selection changes
   * }
   */
  hasEventListeners(event: keyof DiagramEventMap): boolean {
    return this.flowCore.eventManager.hasListeners(event);
  }

  // ==============================
  // Transactions
  // ==============================

  /**
   * Executes a function within a transaction context.
   * All state updates within the callback are batched and applied atomically.
   *
   * @example
   *
   * this.ngDiagramService.transaction(() => {
   *  this.ngDiagramModelService.addNodes([node1, node2]);
   *  this.ngDiagramModelService.addEdges([edge1]);
   * });
   **/
  transaction(callback: () => void): void {
    const transactionCallback: TransactionCallback = () => {
      return callback();
    };
    this.flowCore.transaction(transactionCallback);
  }
}
