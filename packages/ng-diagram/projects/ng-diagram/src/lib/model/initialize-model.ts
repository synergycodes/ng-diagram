import { inject, Injector, runInInjectionContext } from '@angular/core';
import { assignInternalId, type Model, type ModelAdapter } from '../../core/src';
import { EnvironmentProviderService } from '../services/environment-provider/environment-provider.service';
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
 *
 * @public
 * @since 0.8.0
 * @category Utilities
 */
export function initializeModel(model: Partial<Model> = {}, injector?: Injector): ModelAdapter {
  const create = () => {
    const environment = inject(EnvironmentProviderService);

    const adapter = new SignalModelAdapter();
    const generateId = () => environment.generateId();

    adapter.updateNodes((model.nodes || []).map((node) => assignInternalId(node, generateId)));
    adapter.updateEdges((model.edges || []).map((edge) => assignInternalId(edge, generateId)));
    adapter.updateMetadata((prev) => ({ ...prev, ...model.metadata }));

    return adapter;
  };

  return injector ? runInInjectionContext(injector, create) : create();
}
