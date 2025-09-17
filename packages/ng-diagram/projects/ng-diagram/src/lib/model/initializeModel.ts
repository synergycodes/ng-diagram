import { Injector, runInInjectionContext } from '@angular/core';
import type { Model } from '@ng-diagram/core';
import { SignalModelAdapter } from './signal-model-adapter';

/**
 * Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.
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
