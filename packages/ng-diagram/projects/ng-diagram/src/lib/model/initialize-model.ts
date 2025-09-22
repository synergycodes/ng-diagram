import { Injector, runInInjectionContext } from '@angular/core';
import type { Model } from '../../core/src';
import { SignalModelAdapter } from './signal-model-adapter';

/**
 * Creates a model adapter with initial nodes, edges, and metadata.
 *
 * This helper sets up a model instance ready for use in ng-diagram.
 * It must be run in an Angular injection context unless the `injector` option is provided manually.
 *
 * ⚠️ This is only for creating the initial model. Any changes to the model or
 * access to current data should be done via {@link NgDiagramModelService}.
 *
 * @param model Initial model data (nodes, edges, metadata).
 * @param injector Optional Angular `Injector` if not running inside an injection context.
 */
export function initializeModel(model: Partial<Model> = {}, injector?: Injector) {
  const create = () => {
    const adapter = new SignalModelAdapter();
    adapter.updateNodes(model.nodes || []);
    adapter.updateEdges(model.edges || []);
    adapter.setMetadata((prev) => ({ ...prev, ...model.metadata }));

    return adapter;
  };

  return injector ? runInInjectionContext(injector, create) : create();
}
