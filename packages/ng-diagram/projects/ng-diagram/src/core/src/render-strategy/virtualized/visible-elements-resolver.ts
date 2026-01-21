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
    const { nodes, nodeIds } = this.buildNodeList(primaryVisibleIds, externalNodeIds);

    return { nodes, edges, nodeIds, edgeIds };
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

        edges.push(edge);
        edgeIds.add(edge.id);

        // Add external nodes (endpoints not in primary visible set)
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
