import type { Edge, Node } from '../types';
import type { RenderStrategy, RenderStrategyResult } from './render-strategy.interface';

// Reusable empty set for direct rendering (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Direct render strategy - returns all nodes and edges without virtualization.
 * Used when virtualization is disabled.
 */
export class DirectRenderStrategy implements RenderStrategy {
  process(nodes: Node[], edges: Edge[]): RenderStrategyResult {
    return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
  }
}
