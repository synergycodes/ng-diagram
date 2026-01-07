import type { FlowCore } from '../../flow-core';
import type { Edge, Node, Viewport } from '../../types';
import { BaseRenderStrategy } from '../base-render-strategy';
import type { RenderStrategyResult } from '../render-strategy.interface';
import { IdleManager } from './idle-manager';
import { ResultCache } from './result-cache';
import { getViewportRect, shouldBypassVirtualization } from './viewport-utils';
import { VisibleElementsResolver } from './visible-elements-resolver';

// Reusable empty set for bypass results (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Virtualized render strategy - returns only nodes and edges visible in the viewport.
 * Used when virtualization is enabled for large diagrams.
 *
 * Handles idle management for both panning and zooming:
 * - During active panning/zooming: uses cached results for performance
 * - After idle period: renders with expanded buffer to preload more nodes
 */
export class VirtualizedRenderStrategy extends BaseRenderStrategy {
  private readonly cache = new ResultCache();
  private readonly visibleElementsResolver: VisibleElementsResolver;
  private readonly idleManager: IdleManager;

  // Track nodes reference for optimization (skip spatialHash update during panning/zooming)
  private lastNodesRef: Node[] | null = null;

  constructor(flowCore: FlowCore) {
    super(flowCore);

    this.visibleElementsResolver = new VisibleElementsResolver(flowCore);
    this.idleManager = new IdleManager(flowCore.config.virtualization, () => {
      this.cache.invalidateViewport();
      this.render();
    });

    this.idleManager.subscribeToActionState(flowCore.eventManager);
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

    if (shouldBypassVirtualization(nodes, viewport, config)) {
      return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
    }

    // Check if we should use expanded buffer (set by idle callbacks)
    const useExpandedBuffer = this.idleManager.consumePendingExpandedBuffer();

    // Handle zoom tracking
    this.idleManager.handleScaleChange(viewport!.scale);

    const paddingMultiplier = useExpandedBuffer ? config.expandedPadding : config.padding;
    const viewportRect = getViewportRect(viewport!, paddingMultiplier);

    // During active zooming or panning, use cached result to avoid lag
    const isPanning = this.flowCore.actionStateManager.isPanning();
    const hasCache = this.cache.hasCache();

    // Skip caching when using expanded buffer - we want fresh computation
    if (!useExpandedBuffer) {
      if (this.idleManager.getIsZooming() && hasCache) {
        return this.cache.get(nodes, edges);
      }

      if (isPanning && hasCache) {
        // During panning, use cache unless we've moved too far from last recompute
        if (!this.cache.hasMovedTooFar(viewportRect)) {
          return this.cache.get(nodes, edges);
        }
        // Moved too far - fall through to recompute
      }

      if (this.cache.canUse(nodes.length, edges.length, viewportRect)) {
        return this.cache.get(nodes, edges);
      }
    }

    const result = this.visibleElementsResolver.resolve(viewportRect);

    // Cache the full result
    this.cache.set(result, nodes, edges, viewportRect);

    return result;
  }

  invalidateCache(): void {
    this.cache.invalidate();
  }

  destroy(): void {
    this.idleManager.destroy();
  }
}
