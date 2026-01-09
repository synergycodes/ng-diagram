import type { FlowCore } from '../../flow-core';
import type { Edge, Node, Viewport } from '../../types';
import { BaseRenderStrategy } from '../base-render-strategy';
import type { RenderStrategyResult } from '../render-strategy.interface';
import { ResultCache } from './result-cache';
import { getViewportRect, shouldBypassVirtualization } from './viewport-utils';
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

  // Track nodes reference for optimization (skip spatialHash update during panning/zooming)
  private lastNodesRef: Node[] | null = null;

  // Pan-stop detection for expanded buffer rendering
  private wasPanning = false;
  private idleTimeout: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeActionState: (() => void) | null = null;

  constructor(flowCore: FlowCore) {
    super(flowCore);
    this.visibleElementsResolver = new VisibleElementsResolver(flowCore);
    this.zoomTracker = new ZoomTracker(() => {
      this.cache.invalidateViewport();
      this.render();
    });
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

    // Subscribe to action state changes to detect pan stop
    this.unsubscribeActionState = this.flowCore.eventManager.on('actionStateChanged', ({ actionState }) => {
      const isPanning = !!actionState.panning?.active;

      if (this.wasPanning && !isPanning) {
        // Pan just stopped - schedule expanded buffer render
        this.scheduleIdleRender();
      } else if (isPanning && this.idleTimeout) {
        // Panning started again - cancel pending idle render
        clearTimeout(this.idleTimeout);
        this.idleTimeout = null;
      }

      this.wasPanning = isPanning;
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

  /**
   * Schedules an expanded buffer render after panning stops.
   * Uses idleDelay config to wait before rendering with expandedPadding.
   */
  private scheduleIdleRender(): void {
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
    }

    const delay = this.flowCore.config.virtualization.idleDelay ?? 100;
    this.idleTimeout = setTimeout(() => {
      this.cache.invalidateViewport();
      this.render();
      this.idleTimeout = null;
    }, delay);
  }

  process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult {
    const config = this.flowCore.config.virtualization;

    if (shouldBypassVirtualization(nodes, viewport, config)) {
      return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
    }

    this.zoomTracker.handleScaleChange(viewport!.scale);

    // Use smaller padding during panning, larger padding when idle
    const isPanning = this.flowCore.actionStateManager.isPanning();
    const padding = isPanning ? config.padding : (config.expandedPadding ?? config.padding);
    const viewportRect = getViewportRect(viewport!, padding);
    const hasCache = this.cache.hasCache();

    // During active zooming, use cached result to avoid lag
    if (this.zoomTracker.getIsZooming() && hasCache) {
      return this.cache.get(nodes, edges);
    }

    // During panning, use cache unless we've moved too far
    if (isPanning && hasCache) {
      if (!this.cache.hasMovedTooFar(viewportRect)) {
        return this.cache.get(nodes, edges);
      }
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
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout);
      this.idleTimeout = null;
    }
    if (this.unsubscribeActionState) {
      this.unsubscribeActionState();
      this.unsubscribeActionState = null;
    }
  }
}
