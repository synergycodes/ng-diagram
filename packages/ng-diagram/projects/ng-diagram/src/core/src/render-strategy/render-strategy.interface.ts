import type { Edge, Node, Viewport } from '../types';

export interface RenderStrategyResult {
  nodes: Node[];
  edges: Edge[];
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

export interface RenderStrategy {
  /**
   * Initializes the strategy. Sets up model change handlers and starts the init process.
   */
  init(): void;
  process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult;
}
