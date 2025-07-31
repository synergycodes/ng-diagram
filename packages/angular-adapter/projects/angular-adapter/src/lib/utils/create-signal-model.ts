import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import { Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares, Model } from '@angularflow/core';

/**
 * Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.
 */
export function createSignalModel<TMiddlewares extends MiddlewareChain = []>(
  model: Partial<Model<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>> = {}
) {
  const modelAdapter = new SignalModelAdapter<TMiddlewares>();
  modelAdapter.setNodes(model.nodes || []);
  modelAdapter.setEdges(model.edges || []);
  modelAdapter.setMetadata((prev) => ({ ...prev, ...model.metadata }));

  return modelAdapter;
}
