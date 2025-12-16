import { FlowCore } from '../flow-core';
import type { Edge, Node, Rect, Viewport, VirtualizationConfig } from '../types';
import { isGroup } from '../utils';
import type { RenderStrategy, RenderStrategyResult } from './render-strategy.interface';

const DEFAULT_VIEWPORT_WIDTH = 1920;
const DEFAULT_VIEWPORT_HEIGHT = 1080;

// Percentage of viewport dimensions that triggers recomputation
const RECOMPUTE_THRESHOLD = 0.25;

// Delay before recomputing after zoom stops (ms)
const ZOOM_IDLE_DELAY = 150;

// Distance threshold (as fraction of viewport) that triggers recompute during panning
const PAN_DISTANCE_THRESHOLD = 0.5;

// Reusable empty set for bypass results (avoids allocation on every call)
const EMPTY_SET = new Set<string>();

/**
 * Virtualized render strategy - returns only nodes and edges visible in the viewport.
 * Used when virtualization is enabled for large diagrams.
 */
export class VirtualizedRenderStrategy implements RenderStrategy {
  private lastViewportRect: Rect | null = null;
  private lastNodesLength = 0;
  private lastEdgesLength = 0;
  // Cache only IDs, not objects - objects may be updated (e.g., edge routing adds positions)
  private cachedNodeIds: Set<string> | null = null;
  private cachedEdgeIds: Set<string> | null = null;

  // Zoom tracking for deferred recomputation
  private lastScale: number | null = null;
  private zoomIdleTimeout: ReturnType<typeof setTimeout> | null = null;
  private isZooming = false;

  constructor(private readonly flowCore: FlowCore) {}

  process(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult {
    const config = this.flowCore.config.virtualization;

    if (this.shouldBypass(nodes, viewport, config)) {
      return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
    }

    // Detect zoom changes and defer recomputation during active zooming
    const currentScale = viewport!.scale;
    const scaleChanged = this.lastScale !== null && this.lastScale !== currentScale;

    if (scaleChanged) {
      this.isZooming = true;
      this.scheduleZoomIdle();
    }

    this.lastScale = currentScale;

    const viewportRect = this.getViewportRect(viewport!, config.padding);

    // During active zooming or panning, use cached result to avoid lag
    const isPanning = this.flowCore.actionStateManager.isPanning();
    const hasCache = this.cachedNodeIds && this.cachedEdgeIds;

    if (this.isZooming && hasCache) {
      return this.buildResultFromCachedIds(nodes, edges);
    }

    if (isPanning && hasCache) {
      // During panning, use cache unless we've moved too far from last recompute
      if (this.lastViewportRect && !this.hasMovedTooFar(viewportRect, this.lastViewportRect)) {
        return this.buildResultFromCachedIds(nodes, edges);
      }
      // Moved too far - fall through to recompute
    }

    if (this.canUseCachedResult(nodes.length, edges.length, viewportRect)) {
      // Use cached IDs but look up fresh objects from input arrays
      return this.buildResultFromCachedIds(nodes, edges);
    }

    const result = this.computeVisibleElements(viewportRect);

    // Cache the IDs directly from the result (already computed, no extra allocation)
    this.cachedNodeIds = result.nodeIds;
    this.cachedEdgeIds = result.edgeIds;
    this.lastViewportRect = viewportRect;
    this.lastNodesLength = nodes.length;
    this.lastEdgesLength = edges.length;

    return result;
  }

  /**
   * Schedules a callback to mark zooming as complete after idle period.
   * Resets the timer on each call to debounce rapid zoom events.
   */
  private scheduleZoomIdle(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
    }

    this.zoomIdleTimeout = setTimeout(() => {
      this.isZooming = false;
      this.zoomIdleTimeout = null;
      // Invalidate cache to force recomputation on next render
      this.lastViewportRect = null;
      // Trigger a render to update with new zoom level
      this.flowCore.renderWithExpandedBuffer();
    }, ZOOM_IDLE_DELAY);
  }

  private buildResultFromCachedIds(nodes: Node[], edges: Edge[]): RenderStrategyResult {
    const filteredNodes = nodes.filter((n) => this.cachedNodeIds!.has(n.id));
    const filteredEdges = edges.filter((e) => this.cachedEdgeIds!.has(e.id));
    // Reuse cached Sets - no new allocation
    return { nodes: filteredNodes, edges: filteredEdges, nodeIds: this.cachedNodeIds!, edgeIds: this.cachedEdgeIds! };
  }

  invalidateCache(): void {
    this.cachedNodeIds = null;
    this.cachedEdgeIds = null;
    this.lastViewportRect = null;
    this.lastNodesLength = 0;
    this.lastEdgesLength = 0;
  }

  destroy(): void {
    if (this.zoomIdleTimeout) {
      clearTimeout(this.zoomIdleTimeout);
    }
  }

  /**
   * Process with expanded buffer padding - used during pan idle to preload more nodes.
   * Uses expandedPadding from config instead of normal padding.
   */
  processWithExpandedBuffer(nodes: Node[], edges: Edge[], viewport: Viewport | undefined): RenderStrategyResult {
    const config = this.flowCore.config.virtualization;

    if (this.shouldBypass(nodes, viewport, config)) {
      return { nodes, edges, nodeIds: EMPTY_SET, edgeIds: EMPTY_SET };
    }

    // Use expanded padding for buffer fill
    const viewportRect = this.getViewportRect(viewport!, config.expandedPadding);

    // Force fresh computation with expanded buffer
    const result = this.computeVisibleElements(viewportRect);

    // Update cache with expanded buffer results
    this.cachedNodeIds = result.nodeIds;
    this.cachedEdgeIds = result.edgeIds;
    this.lastViewportRect = viewportRect;
    this.lastNodesLength = nodes.length;
    this.lastEdgesLength = edges.length;

    return result;
  }

  private shouldBypass(nodes: Node[], viewport: Viewport | undefined, config: VirtualizationConfig): boolean {
    // Note: config.enabled check is handled by strategy selection in FlowCore
    return !viewport || nodes.length < config.nodeCountThreshold;
  }

  private getViewportRect(viewport: Viewport, paddingMultiplier: number): Rect {
    const { x, y, scale, width, height } = viewport;

    const effectiveWidth = width || DEFAULT_VIEWPORT_WIDTH;
    const effectiveHeight = height || DEFAULT_VIEWPORT_HEIGHT;

    const flowX = -x / scale;
    const flowY = -y / scale;
    const flowWidth = effectiveWidth / scale;
    const flowHeight = effectiveHeight / scale;

    // Calculate padding as a multiple of the largest viewport dimension (in flow coordinates)
    const maxFlowDimension = Math.max(flowWidth, flowHeight);
    const padding = maxFlowDimension * paddingMultiplier;

    return {
      x: flowX - padding,
      y: flowY - padding,
      width: flowWidth + padding * 2,
      height: flowHeight + padding * 2,
    };
  }

  private canUseCachedResult(nodesLength: number, edgesLength: number, viewportRect: Rect): boolean {
    if (!this.cachedNodeIds || !this.cachedEdgeIds || !this.lastViewportRect) {
      return false;
    }

    if (nodesLength !== this.lastNodesLength || edgesLength !== this.lastEdgesLength) {
      return false;
    }

    return this.isViewportSimilar(this.lastViewportRect, viewportRect);
  }

  private isViewportSimilar(prev: Rect, current: Rect): boolean {
    // Only recompute when viewport moved by more than 25% of its dimensions
    const xThreshold = prev.width * RECOMPUTE_THRESHOLD;
    const yThreshold = prev.height * RECOMPUTE_THRESHOLD;

    return (
      Math.abs(prev.x - current.x) < xThreshold &&
      Math.abs(prev.y - current.y) < yThreshold &&
      Math.abs(prev.width - current.width) < 10 &&
      Math.abs(prev.height - current.height) < 10
    );
  }

  /**
   * Checks if viewport has moved too far from the cached position.
   * Used during panning to trigger recompute when accumulated distance is large.
   */
  private hasMovedTooFar(current: Rect, cached: Rect): boolean {
    const xThreshold = cached.width * PAN_DISTANCE_THRESHOLD;
    const yThreshold = cached.height * PAN_DISTANCE_THRESHOLD;

    return Math.abs(current.x - cached.x) > xThreshold || Math.abs(current.y - cached.y) > yThreshold;
  }

  private computeVisibleElements(viewportRect: Rect): RenderStrategyResult {
    const primaryVisibleIds = this.getPrimaryVisibleIds(viewportRect);
    const { edges, edgeIds, externalNodeIds } = this.collectVisibleEdges(primaryVisibleIds);
    const { nodes, nodeIds } = this.buildNodeList(primaryVisibleIds, externalNodeIds);

    return { nodes, edges, nodeIds, edgeIds };
  }

  /**
   * Gets node IDs visible in viewport, including descendants of visible groups.
   */
  private getPrimaryVisibleIds(viewportRect: Rect): Set<string> {
    const primaryVisibleIds = new Set(this.flowCore.spatialHash.queryIds(viewportRect));

    this.addGroupDescendants(primaryVisibleIds);

    return primaryVisibleIds;
  }

  /**
   * Expands the set to include all descendants of visible group nodes.
   */
  private addGroupDescendants(nodeIds: Set<string>): void {
    const nodesMap = this.flowCore.modelLookup.nodesMap;

    // Collect group IDs first to avoid mutating set while iterating
    const groupIds: string[] = [];
    for (const nodeId of nodeIds) {
      const node = nodesMap.get(nodeId);
      if (node && isGroup(node)) {
        groupIds.push(nodeId);
      }
    }

    // Add descendants directly to set
    for (const groupId of groupIds) {
      for (const descendantId of this.flowCore.modelLookup.getAllDescendantIds(groupId)) {
        nodeIds.add(descendantId);
      }
    }
  }

  /**
   * Collects edges connected to primary visible nodes and identifies external nodes.
   * External nodes are nodes outside viewport but connected to visible nodes.
   */
  private collectVisibleEdges(primaryVisibleIds: Set<string>): {
    edges: Edge[];
    edgeIds: Set<string>;
    externalNodeIds: Set<string>;
  } {
    const edges: Edge[] = [];
    const edgeIds = new Set<string>();
    const externalNodeIds = new Set<string>();

    for (const nodeId of primaryVisibleIds) {
      for (const edge of this.flowCore.modelLookup.getConnectedEdges(nodeId)) {
        if (edgeIds.has(edge.id)) continue;

        edges.push(edge);
        edgeIds.add(edge.id);

        // Add external nodes (endpoints not in primary visible set)
        if (!primaryVisibleIds.has(edge.source)) externalNodeIds.add(edge.source);
        if (!primaryVisibleIds.has(edge.target)) externalNodeIds.add(edge.target);
      }
    }

    return { edges, edgeIds, externalNodeIds };
  }

  /**
   * Builds the final node list from primary visible and external node IDs.
   */
  private buildNodeList(
    primaryVisibleIds: Set<string>,
    externalNodeIds: Set<string>
  ): { nodes: Node[]; nodeIds: Set<string> } {
    const nodesMap = this.flowCore.modelLookup.nodesMap;
    const nodes: Node[] = [];
    const nodeIds = new Set<string>();

    for (const id of primaryVisibleIds) {
      const node = nodesMap.get(id);
      if (node) {
        nodes.push(node);
        nodeIds.add(id);
      }
    }

    for (const id of externalNodeIds) {
      const node = nodesMap.get(id);
      if (node) {
        nodes.push(node);
        nodeIds.add(id);
      }
    }

    return { nodes, nodeIds };
  }
}
