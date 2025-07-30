import { SignalModelAdapter } from '@angularflow/angular-signals-model';
import type { Edge, Metadata, MiddlewareChain, MiddlewaresConfigFromMiddlewares, Node } from '@angularflow/core';

/**
 * Helper to create a SignalModelAdapter with initial nodes, edges, and metadata.
 */
export function createSignalModel<TMiddlewares extends MiddlewareChain = []>(
  params: {
    nodes?: Node[];
    edges?: Edge[];
    metadata?: Partial<Metadata<MiddlewaresConfigFromMiddlewares<TMiddlewares>>>;
  } = {}
) {
  const model = new SignalModelAdapter<TMiddlewares>();
  if (params.nodes) model.setNodes(params.nodes);
  if (params.edges) model.setEdges(params.edges);
  if (params.metadata) model.setMetadata((prev) => ({ ...prev, ...params.metadata }));
  return model;
}
