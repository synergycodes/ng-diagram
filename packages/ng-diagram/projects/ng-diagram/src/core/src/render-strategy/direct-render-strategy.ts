import type { FlowCore } from '../flow-core';
import type { Edge, Node } from '../types';
import { BaseRenderStrategy } from './base-render-strategy';
import type { RenderStrategyResult } from './render-strategy.interface';

// Reusable empty set for direct rendering (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Direct render strategy - returns all nodes and edges without virtualization.
 * Used when virtualization is disabled.
 */
export class DirectRenderStrategy extends BaseRenderStrategy {
  constructor(flowCore: FlowCore) {
    super(flowCore);
  }

  init(): void {
    this.render();

    this.flowCore.model.onChange((state) => {
      this.flowCore.spatialHash.process(state.nodes);
      this.flowCore.modelLookup.desynchronize();
      this.render();
    });

    const nodes = this.flowCore.model.getNodes();
    const edges = this.flowCore.model.getEdges();
    this.flowCore.initUpdater.start(nodes, edges, async () => {
      await this.flowCore.commandHandler.emit('init', {
        renderedNodeIds: nodes.map((n) => n.id),
        renderedEdgeIds: edges.map((e) => e.id),
      });
    });
  }

  process(nodes: Node[], edges: Edge[]): RenderStrategyResult {
    return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
  }
}
