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

  // Effective-visibility tracking: the result cache keys on element COUNTS and
  // viewport only, so a hidden/unhidden toggle (counts unchanged) would keep
  // serving a stale render set until the next pan/zoom. The hidden-id sets are
  // diffed on model changes (never on viewport-only changes) to invalidate it.
  private lastEdgesRef: Edge[] | null = null;
  private lastHiddenNodeIds = new Set<string>();
  private lastHiddenEdgeIds = new Set<string>();

  constructor(flowCore: FlowCore) {
    super(flowCore);
    this.visibleElementsResolver = new VisibleElementsResolver(flowCore);
    this.zoomTracker = new ZoomTracker(() => this.invalidateAndRender());
    this.idleRenderScheduler = new IdleRenderScheduler(flowCore, () => this.invalidateAndRender());
  }

  init(): void {
    this.flowCore.spatialHash.process(this.flowCore.model.getNodes());
    // Seed the visibility tracking with the initial model, or the first
    // toggle after load would diff against empty sets and go unnoticed.
    this.trackHiddenNodes(this.flowCore.model.getNodes());
    this.trackHiddenEdges(this.flowCore.model.getEdges());

    this.flowCore.model.onChange((state) => {
      let visibilityChanged = false;

      // Optimization: skip spatialHash update during panning/zooming (nodes reference stays the same)
      if (state.nodes !== this.lastNodesRef) {
        this.flowCore.spatialHash.process(state.nodes);
        this.flowCore.modelLookup.desynchronize();
        this.lastNodesRef = state.nodes;
        visibilityChanged = this.trackHiddenNodes(state.nodes) || visibilityChanged;
      }

      if (state.edges !== this.lastEdgesRef) {
        this.lastEdgesRef = state.edges;
        visibilityChanged = this.trackHiddenEdges(state.edges) || visibilityChanged;
      }

      if (visibilityChanged) {
        this.cache.invalidate();
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

  /** @returns true when the set of effectively hidden nodes changed */
  private trackHiddenNodes(nodes: Node[]): boolean {
    const hiddenIds = collectHiddenIds(nodes);
    if (areSetsEqual(hiddenIds, this.lastHiddenNodeIds)) {
      return false;
    }
    this.lastHiddenNodeIds = hiddenIds;
    return true;
  }

  /** @returns true when the set of effectively hidden edges changed */
  private trackHiddenEdges(edges: Edge[]): boolean {
    const hiddenIds = collectHiddenIds(edges);
    if (areSetsEqual(hiddenIds, this.lastHiddenEdgeIds)) {
      return false;
    }
    this.lastHiddenEdgeIds = hiddenIds;
    return true;
  }
}

const collectHiddenIds = (elements: readonly { id: string; computedHidden?: boolean }[]): Set<string> => {
  const hiddenIds = new Set<string>();
  for (const element of elements) {
    if (element.computedHidden) {
      hiddenIds.add(element.id);
    }
  }
  return hiddenIds;
};

const areSetsEqual = (a: Set<string>, b: Set<string>): boolean => {
  if (a.size !== b.size) return false;
  for (const value of a) {
    if (!b.has(value)) return false;
  }
  return true;
};
