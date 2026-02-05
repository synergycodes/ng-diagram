import type { Edge, Node, Rect } from '../../types';
import type { RenderStrategyResult } from '../render-strategy.interface';
import { hasMovedTooFar, isViewportSimilar } from './viewport-utils';

/**
 * Manages cached render results to avoid recomputation during pan/zoom.
 * Caches node/edge IDs and filters from current arrays when cache is used.
 */
export class ResultCache {
  private cachedResult: RenderStrategyResult | null = null;
  private lastViewportRect: Rect | null = null;
  private lastNodesLength = 0;
  private lastEdgesLength = 0;

  hasCache(): boolean {
    return this.cachedResult !== null;
  }

  isNodeInCache(nodeId: string): boolean {
    return this.cachedResult?.nodeIds.has(nodeId) ?? false;
  }

  /**
   * Returns cached result by filtering from current arrays using cached IDs.
   * Always creates fresh filtered arrays to ensure consistency with rendered content.
   */
  get(nodes: Node[], edges: Edge[]): RenderStrategyResult {
    const cached = this.cachedResult!;

    const filteredNodes = nodes.filter((n) => cached.nodeIds.has(n.id));
    const filteredEdges = edges.filter((e) => cached.edgeIds.has(e.id));

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      nodeIds: cached.nodeIds,
      edgeIds: cached.edgeIds,
    };
  }

  set(result: RenderStrategyResult, nodes: Node[], edges: Edge[], viewportRect: Rect): void {
    this.cachedResult = result;
    this.lastViewportRect = viewportRect;
    this.lastNodesLength = nodes.length;
    this.lastEdgesLength = edges.length;
  }

  canUse(nodesLength: number, edgesLength: number, viewportRect: Rect): boolean {
    if (!this.cachedResult || !this.lastViewportRect) {
      return false;
    }

    if (nodesLength !== this.lastNodesLength || edgesLength !== this.lastEdgesLength) {
      return false;
    }

    return isViewportSimilar(this.lastViewportRect, viewportRect);
  }

  hasMovedTooFar(viewportRect: Rect): boolean {
    if (!this.lastViewportRect) {
      return true;
    }
    return hasMovedTooFar(viewportRect, this.lastViewportRect);
  }

  invalidateViewport(): void {
    this.lastViewportRect = null;
  }

  invalidate(): void {
    this.cachedResult = null;
    this.lastViewportRect = null;
    this.lastNodesLength = 0;
    this.lastEdgesLength = 0;
  }
}
