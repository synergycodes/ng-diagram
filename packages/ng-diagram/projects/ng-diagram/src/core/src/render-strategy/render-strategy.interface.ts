import type { Edge, Node, Viewport } from '../types';

export interface RenderStrategyResult {
  nodes: Node[];
  edges: Edge[];
  nodeIds: Set<string>;
  edgeIds: Set<string>;
}

export interface RenderStrategy {
  process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult;
  invalidateCache?(): void;
  destroy?(): void;
}
