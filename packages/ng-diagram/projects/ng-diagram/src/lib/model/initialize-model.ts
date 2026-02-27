import { inject, Injector, runInInjectionContext } from '@angular/core';
import { assignInternalId, type Model, type ModelAdapter } from '../../core/src';
import { EnvironmentProviderService } from '../services/environment-provider/environment-provider.service';
import { SignalModelAdapter } from './signal-model-adapter';
import { stripEdgeRuntimeProperties, stripNodeRuntimeProperties } from './strip-runtime-properties';

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
 * ```
 *
 * @param model Initial model data (nodes, edges, metadata).
 * @param injector Optional Angular `Injector` if not running inside an injection context.
 *
 * @public
 * @since 0.8.0
 * @category Utilities
 */
export function initializeModel(model: Partial<Model> = {}, injector?: Injector): ModelAdapter {
  const init = () => initializeModelAdapter(new SignalModelAdapter(), model);

  return injector ? runInInjectionContext(injector, init) : init();
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
 * @param adapter An existing ModelAdapter to initialize.
 * @param model Optional initial model data to seed the adapter with before stripping and ID assignment.
 * @param injector Optional Angular `Injector` if not running inside an injection context.
 *
 * @public
 * @since 1.1.0
 * @category Utilities
 */
export function initializeModelAdapter(
  adapter: ModelAdapter,
  model?: Partial<Model>,
  injector?: Injector
): ModelAdapter {
  const init = () => {
    const environment = inject(EnvironmentProviderService);
    const generateId = () => environment.generateId();

    if (model) {
      adapter.updateNodes(model.nodes || []);
      adapter.updateEdges(model.edges || []);
      adapter.updateMetadata((prev) => ({ ...prev, ...model.metadata }));
    }

    adapter.updateNodes(
      adapter.getNodes().map((node) => assignInternalId(stripNodeRuntimeProperties(node), generateId))
    );
    adapter.updateEdges(
      adapter.getEdges().map((edge) => assignInternalId(stripEdgeRuntimeProperties(edge), generateId))
    );

    return adapter;
  };

  return injector ? runInInjectionContext(injector, init) : init();
}
