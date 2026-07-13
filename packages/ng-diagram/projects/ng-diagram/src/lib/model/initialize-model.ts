import { inject, Injector, runInInjectionContext, untracked } from '@angular/core';
import { assignInternalId, type Model, type ModelAdapter } from '../../core/src';
import { EnvironmentProviderService } from '../services/environment-provider/environment-provider.service';
import { SignalModelAdapter } from './signal-model-adapter';
import {
  stripEdgeRuntimeProperties,
  stripNodeRuntimeProperties,
  type StripEdgeRuntimePropertiesFn,
  type StripNodeRuntimePropertiesFn,
} from './strip-runtime-properties';

/**
 * Options for {@link initializeModel} and {@link initializeModelAdapter}.
 *
 * @public
 * @since 1.2.5
 * @category Types/Model
 */
export interface InitializeModelOptions {
  /**
   * Replaces the function that strips runtime-computed properties from nodes
   * during initialization (and, for the default model created by
   * {@link initializeModel}, during `toJSON()` serialization).
   *
   * ⚠️ **Use at your own risk.** The default ({@link stripNodeRuntimeProperties})
   * exists because stale runtime values (`selected`, `measuredPorts`,
   * `measuredBounds`, `computedZIndex`, `_internalId`) loaded from persistence
   * can and probably will break the diagram — e.g. skipped DOM measurements,
   * wrong z-ordering, or duplicated internal ids. Overriding this function and
   * keeping such properties is unsupported territory; prefer wrapping the
   * default and re-adding only the properties you know you need.
   */
  stripNodeRuntimeProperties?: StripNodeRuntimePropertiesFn;
  /**
   * Replaces the function that strips runtime-computed properties from edges
   * during initialization (and, for the default model created by
   * {@link initializeModel}, during `toJSON()` serialization).
   *
   * ⚠️ **Use at your own risk.** The default ({@link stripEdgeRuntimeProperties})
   * exists because stale runtime values (`sourcePosition`, `targetPosition`,
   * `measuredLabels`, `computedZIndex`, `_internalId`) loaded from persistence
   * can and probably will break the diagram — e.g. edges rendered at outdated
   * positions or duplicated internal ids. Overriding this function and keeping
   * such properties is unsupported territory; prefer wrapping the default and
   * re-adding only the properties you know you need.
   */
  stripEdgeRuntimeProperties?: StripEdgeRuntimePropertiesFn;
}

/**
 * Creates a model adapter with initial nodes, edges, and metadata.
 *
 * This helper sets up a model instance ready for use in ng-diagram.
 * It must be run in an Angular injection context unless the `injector` option is provided manually.
 *
 * ⚠️ This is only for creating the initial model. Any changes to the model or
 * access to current data should be done via {@link NgDiagramModelService}.
 *
 * @example
 * ```typescript
 * // Create an empty model
 * model = initializeModel();
 *
 * // Create a model with initial data
 * model = initializeModel({
 *   nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }],
 *   edges: [],
 * });
 *
 * // With an explicit injector (outside injection context)
 * model = initializeModel({ nodes: [...], edges: [...] }, this.injector);
 *
 * // Safe to use inside reactive contexts (computed, effect, linkedSignal)
 * model = computed(() => initializeModel(this.myModel(), this.injector));
 *
 * // ⚠️ At your own risk: customize which runtime properties are stripped
 * model = initializeModel({ nodes: [...], edges: [...] }, undefined, {
 *   stripEdgeRuntimeProperties: (edge) => ({
 *     ...stripEdgeRuntimeProperties(edge),
 *     sourcePosition: edge.sourcePosition, // keep authored free-endpoint position
 *   }),
 * });
 * ```
 *
 * ## Version History
 *
 * | Version | Changes |
 * |---------|---------|
 * | v0.8.0  | Introduced |
 * | v1.2.0  | Can now be safely used inside reactive contexts (`computed`, `effect`, `linkedSignal`) |
 * | v1.2.5  | Added `options` parameter for customizing runtime-property stripping |
 *
 * @param model Initial model data (nodes, edges, metadata).
 * @param injector Optional Angular `Injector` if not running inside an injection context.
 * @param options Optional {@link InitializeModelOptions}. ⚠️ Overriding the strip
 * functions can and probably will break the diagram — use at your own risk.
 *
 * @public
 * @since 0.8.0
 * @category Utilities
 */
export function initializeModel(
  model: Partial<Model> = {},
  injector?: Injector,
  options?: InitializeModelOptions
): ModelAdapter {
  return untracked(() => {
    const init = () => {
      const adapter = new SignalModelAdapter();
      if (options?.stripNodeRuntimeProperties) {
        adapter.stripNodeRuntimeProperties = options.stripNodeRuntimeProperties;
      }
      if (options?.stripEdgeRuntimeProperties) {
        adapter.stripEdgeRuntimeProperties = options.stripEdgeRuntimeProperties;
      }
      return initializeModelAdapter(adapter, model, undefined, options);
    };

    return injector ? runInInjectionContext(injector, init) : init();
  });
}

/**
 * Initializes an existing model adapter for use in ng-diagram.
 *
 * Prepares all nodes and edges in the adapter so they are ready for
 * rendering by ng-diagram. Use this when providing a custom
 * {@link ModelAdapter} implementation.
 *
 * @example
 * ```typescript
 * // Basic usage with a custom adapter
 * model = initializeModelAdapter(new NgRxModelAdapter(this.store));
 *
 * // With initial model data to seed the adapter
 * model = initializeModelAdapter(new NgRxModelAdapter(this.store), {
 *   nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } }],
 *   edges: [],
 * });
 *
 * // With an explicit injector (outside injection context)
 * model = initializeModelAdapter(new NgRxModelAdapter(this.store), undefined, this.injector);
 * ```
 *
 * ## Version History
 *
 * | Version | Changes |
 * |---------|---------|
 * | v1.1.0  | Introduced |
 * | v1.2.5  | Added `options` parameter for customizing runtime-property stripping |
 *
 * @param adapter An existing ModelAdapter to initialize.
 * @param model Optional initial model data to seed the adapter with.
 * @param injector Optional Angular `Injector` if not running inside an injection context.
 * @param options Optional {@link InitializeModelOptions}. ⚠️ Overriding the strip
 * functions can and probably will break the diagram — use at your own risk. Note
 * that for custom adapters these functions only affect initialization; keeping
 * serialization consistent in your adapter's `toJSON()` is up to you.
 *
 * @public
 * @since 1.1.0
 * @category Utilities
 */
export function initializeModelAdapter(
  adapter: ModelAdapter,
  model?: Partial<Model>,
  injector?: Injector,
  options?: InitializeModelOptions
): ModelAdapter {
  const init = () => {
    const environment = inject(EnvironmentProviderService);
    const generateId = () => environment.generateId();
    const stripNode = options?.stripNodeRuntimeProperties ?? stripNodeRuntimeProperties;
    const stripEdge = options?.stripEdgeRuntimeProperties ?? stripEdgeRuntimeProperties;

    if (model) {
      adapter.updateNodes(model.nodes || []);
      adapter.updateEdges(model.edges || []);
      adapter.updateMetadata((prev) => ({ ...prev, ...model.metadata }));
    }

    adapter.updateNodes(adapter.getNodes().map((node) => assignInternalId(stripNode(node), generateId)));
    adapter.updateEdges(adapter.getEdges().map((edge) => assignInternalId(stripEdge(edge), generateId)));

    return adapter;
  };

  return injector ? runInInjectionContext(injector, init) : init();
}
