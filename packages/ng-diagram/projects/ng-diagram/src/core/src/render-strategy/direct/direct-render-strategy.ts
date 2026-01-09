import type { FlowCore } from '../../flow-core';
import type { Edge, Node } from '../../types';
import { BaseRenderStrategy } from '../base-render-strategy';
import type { RenderStrategyResult } from '../render-strategy.interface';

// Reusable empty set for direct rendering (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Direct render strategy - returns all nodes and edges without virtualization.
 * Used when virtualization is disabled.
 */
export class DirectRenderStrategy extends BaseRenderStrategy {
  // Track last references for change detection
  private lastNodesRef: Node[] = [];
  private lastEdgesRef: Edge[] = [];

  constructor(flowCore: FlowCore) {
    super(flowCore);
  }

  init(): void {
    this.render();

    // Initialize reference tracking
    this.lastNodesRef = this.flowCore.model.getNodes();
    this.lastEdgesRef = this.flowCore.model.getEdges();

    this.flowCore.model.onChange((state) => {
      const nodesChanged = state.nodes !== this.lastNodesRef;
      const edgesChanged = state.edges !== this.lastEdgesRef;

      // Only process spatial hash and model lookup if nodes/edges actually changed
      if (nodesChanged || edgesChanged) {
        this.flowCore.spatialHash.process(state.nodes);
        this.flowCore.modelLookup.desynchronize();
        this.lastNodesRef = state.nodes;
        this.lastEdgesRef = state.edges;
      }

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
