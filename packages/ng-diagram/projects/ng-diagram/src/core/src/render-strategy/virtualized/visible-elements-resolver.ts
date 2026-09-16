import type { FlowCore } from '../../flow-core';
import type { Edge, Node, Rect } from '../../types';
import { isGroup } from '../../utils';
import type { RenderStrategyResult } from '../render-strategy.interface';

/**
 * Resolves which nodes and edges are visible within a viewport rect.
 * Uses spatial hashing for efficient queries and handles group node descendants.
 */
export class VisibleElementsResolver {
  constructor(private readonly flowCore: FlowCore) {}

  resolve(viewportRect: Rect): RenderStrategyResult {
    const primaryVisibleIds = this.getPrimaryVisibleIds(viewportRect);
    const { edges, edgeIds, externalNodeIds } = this.collectVisibleEdges(primaryVisibleIds);
    this.collectVisibleDanglingEdges(viewportRect, primaryVisibleIds, edges, edgeIds, externalNodeIds);
    const { nodes, nodeIds } = this.buildNodeList(primaryVisibleIds, externalNodeIds);

    return { nodes, edges, nodeIds, edgeIds };
  }

  /**
   * Adds dangling edges whose visible geometry intersects the viewport.
   * Edge discovery walks connected edges of visible nodes, which can never
   * reach an edge through a free ('' ) endpoint — a dual dangling edge is
   * unreachable that way, and a single-dangling edge disappears the moment its
   * only node scrolls out even when its free endpoint is still on screen.
   */
  private collectVisibleDanglingEdges(
    viewportRect: Rect,
    primaryVisibleIds: Set<string>,
    edges: Edge[],
    edgeIds: Set<string>,
    externalNodeIds: Set<string>
  ): void {
    // The model lookup keeps a cached list of dangling edges, so this stays
    // O(dangling) — the virtualization guarantee (render cost independent of
    // model size) holds when the feature is unused (the list is empty).
    for (const edge of this.flowCore.modelLookup.danglingEdges) {
      if (edgeIds.has(edge.id) || edge.computedHidden) {
        continue;
      }
      if (!this.intersectsViewport(edge, viewportRect)) {
        continue;
      }

      edges.push(edge);
      edgeIds.add(edge.id);

      // The connected endpoint (if any) may be off-screen — render it like the
      // external endpoints of node-discovered edges.
      const connectedNodeId = edge.source || edge.target;
      if (connectedNodeId && !primaryVisibleIds.has(connectedNodeId)) {
        externalNodeIds.add(connectedNodeId);
      }
    }
  }

  /**
   * Whether the bounding box of the edge's routed points and free-endpoint
   * anchors intersects the rect. Bounding-box overlap can render an edge whose
   * path merely skirts the viewport (a benign false positive) but never drops
   * one that crosses it.
   */
  private intersectsViewport(edge: Edge, rect: Rect): boolean {
    const anchors = [
      ...(edge.points ?? []),
      ...(!edge.source && edge.sourcePosition ? [edge.sourcePosition] : []),
      ...(!edge.target && edge.targetPosition ? [edge.targetPosition] : []),
    ];
    if (anchors.length === 0) {
      return false;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const point of anchors) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    return minX <= rect.x + rect.width && maxX >= rect.x && minY <= rect.y + rect.height && maxY >= rect.y;
  }

  private getPrimaryVisibleIds(viewportRect: Rect): Set<string> {
    const primaryVisibleIds = new Set(this.flowCore.spatialHash.queryIds(viewportRect));

    this.addGroupDescendants(primaryVisibleIds);

    return primaryVisibleIds;
  }

  private addGroupDescendants(nodeIds: Set<string>): void {
    const nodesMap = this.flowCore.modelLookup.nodesMap;

    // Snapshot current IDs to avoid mutating set while iterating
    const currentIds = Array.from(nodeIds);

    for (const nodeId of currentIds) {
      const node = nodesMap.get(nodeId);
      if (node && isGroup(node)) {
        for (const descendantId of this.flowCore.modelLookup.getAllDescendantIds(nodeId)) {
          // This path bypasses the spatial hash — effectively hidden
          // descendants must not be re-added to the render set.
          if (nodesMap.get(descendantId)?.computedHidden) {
            continue;
          }
          nodeIds.add(descendantId);
        }
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
        if (edgeIds.has(edge.id)) {
          continue;
        }

        // This path bypasses the spatial hash — effectively hidden edges must
        // not be rendered nor re-add their external endpoints.
        if (edge.computedHidden) {
          continue;
        }

        edges.push(edge);
        edgeIds.add(edge.id);

        // Add external nodes (endpoints not in primary visible set). These are
        // never effectively hidden: an edge with a hidden endpoint is itself
        // hidden (skipped above), so buildNodeList needs no re-filter. If that
        // derivation rule ever gains an override, this path must filter too.
        if (!primaryVisibleIds.has(edge.source)) {
          externalNodeIds.add(edge.source);
        }

        if (!primaryVisibleIds.has(edge.target)) {
          externalNodeIds.add(edge.target);
        }
      }
    }

    return { edges, edgeIds, externalNodeIds };
  }

  private buildNodeList(
    primaryVisibleIds: Set<string>,
    externalNodeIds: Set<string>
  ): { nodes: Node[]; nodeIds: Set<string> } {
    const nodesMap = this.flowCore.modelLookup.nodesMap;

    // Merge IDs into single set (primaryVisibleIds already contains most, just add externals)
    const nodeIds = new Set(primaryVisibleIds);
    for (const id of externalNodeIds) {
      nodeIds.add(id);
    }

    const nodes: Node[] = [];
    for (const id of nodeIds) {
      const node = nodesMap.get(id);
      if (node) {
        nodes.push(node);
      }
    }

    return { nodes, nodeIds };
  }
}
