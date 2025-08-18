import { Injector, runInInjectionContext } from '@angular/core';
import type { Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares, Model } from '@angularflow/core';
import { SignalModelAdapter } from './signal-model-adapter';

/**
 * Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.
 */
export function createSignalModel<TMiddlewares extends MiddlewareChain = []>(
  model: Partial<Model<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>> = {},
  injector?: Injector
) {
  const create = () => {
    const adapter = new SignalModelAdapter<TMiddlewares>();
    adapter.setNodes(model.nodes || []);
    adapter.setEdges(model.edges || []);
    adapter.setMetadata((prev) => ({ ...prev, ...model.metadata }));

    return adapter;
  };

  return injector ? runInInjectionContext(injector, create) : create();
}
