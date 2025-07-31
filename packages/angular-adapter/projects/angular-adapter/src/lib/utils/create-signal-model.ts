import { Injector, runInInjectionContext } from '@angular/core';
import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares, Model } from '@angularflow/core';

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
