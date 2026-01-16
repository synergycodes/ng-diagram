import type { FlowCore } from '../../flow-core';
import type { Edge, Node, Viewport } from '../../types';
import { BaseRenderStrategy } from '../base-render-strategy';
import type { RenderStrategyResult } from '../render-strategy.interface';
import { IdleRenderScheduler } from './idle-render-scheduler';
import { ResultCache } from './result-cache';
import { getViewportRect, isViewportValid } from './viewport-utils';
import { VisibleElementsResolver } from './visible-elements-resolver';
import { ZoomTracker } from './zoom-tracker';

// Reusable empty set for bypass results (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Virtualized render strategy - returns only nodes and edges visible in the viewport.
 * Used when virtualization is enabled for large diagrams.
 */
export class VirtualizedRenderStrategy extends BaseRenderStrategy {
  private readonly cache = new ResultCache();
  private readonly visibleElementsResolver: VisibleElementsResolver;
  private readonly zoomTracker: ZoomTracker;
  private readonly idleRenderScheduler: IdleRenderScheduler;

  // Track nodes reference for optimization (skip spatialHash update during panning/zooming)
  private lastNodesRef: Node[] | null = null;

  constructor(flowCore: FlowCore) {
    super(flowCore);
    this.visibleElementsResolver = new VisibleElementsResolver(flowCore);
    this.zoomTracker = new ZoomTracker(() => this.invalidateAndRender());
    this.idleRenderScheduler = new IdleRenderScheduler(flowCore, () => this.invalidateAndRender());
  }

  init(): void {
    this.flowCore.spatialHash.process(this.flowCore.model.getNodes());

    this.flowCore.model.onChange((state) => {
      // Optimization: skip spatialHash update during panning/zooming (nodes reference stays the same)
      if (state.nodes !== this.lastNodesRef) {
        this.flowCore.spatialHash.process(state.nodes);
        this.flowCore.modelLookup.desynchronize();
        this.lastNodesRef = state.nodes;
      }
      this.render();
    });

    this.idleRenderScheduler.init();

    // Trigger initial render to ensure consistent visible nodes
    this.render();

    const { nodes, edges, metadata } = this.flowCore.getState();
    const result = this.process(nodes, edges, metadata.viewport);
    this.flowCore.initUpdater.start(result.nodes, result.edges, async () => {
      await this.flowCore.commandHandler.emit('init', {
        renderedNodeIds: result.nodes.map((n) => n.id),
        renderedEdgeIds: result.edges.map((e) => e.id),
      });
    });
  }

  process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult {
    const config = this.flowCore.config.virtualization;

    if (!isViewportValid(viewport)) {
      return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
    }

    this.zoomTracker.handleScaleChange(viewport!.scale);

    const padding = config.padding;
    const viewportRect = getViewportRect(viewport!, padding);
    const hasCache = this.cache.hasCache();

    // During active zooming, use cached result to avoid lag
    if (this.zoomTracker.getIsZooming() && hasCache) {
      return this.cache.get(nodes, edges);
    }

    if (this.flowCore.actionStateManager.isPanning() && hasCache) {
      return this.cache.get(nodes, edges);
    }

    if (this.cache.canUse(nodes.length, edges.length, viewportRect)) {
      return this.cache.get(nodes, edges);
    }

    const result = this.visibleElementsResolver.resolve(viewportRect);
    this.cache.set(result, nodes, edges, viewportRect);

    return result;
  }

  destroy(): void {
    this.zoomTracker.destroy();
    this.idleRenderScheduler.destroy();
  }

  isNodeRendered(nodeId: string): boolean {
    // When viewport is invalid, all nodes are rendered
    const viewport = this.flowCore.model.getMetadata().viewport;
    if (!isViewportValid(viewport)) {
      return true;
    }
    return this.cache.isNodeInCache(nodeId);
  }

  private invalidateAndRender(): void {
    this.cache.invalidateViewport();
    this.render();
  }
}
