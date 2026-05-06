import { Node, ZIndexConfig } from '../../../../types';
import { assignNodeZIndex, computeNodeBaseZIndices } from './assign-node-z-index';
import { createGroupChildrenMap } from './create-group-children-map';

export interface InitializeZIndexResult {
  nodes: Node[];
  /** Cumulative elevation per node — 0 for non-elevated, selectedZIndex for selected, 2*selectedZIndex for selected under selected parent, etc. */
  elevations: Map<string, number>;
}

/**
 * Computes computedZIndex for all nodes in the diagram by processing root nodes
 * and recursing into group hierarchies via assignNodeZIndex.
 * Optionally applies selection elevation when zIndexConfig is provided.
 */
export function initializeZIndex(
  nodesMap: Map<string, Node>,
  zIndexConfig?: ZIndexConfig,
  childrenByGroupId?: Map<string, Node[]>
): InitializeZIndexResult {
  const rootNodes = Array.from(nodesMap.values()).filter((node) => node.groupId == null);
  const childrenByGroupMap = childrenByGroupId ?? createGroupChildrenMap(nodesMap);
  const nodes: Node[] = [];
  const elevations = new Map<string, number>();

  for (const root of rootNodes) {
    const result = assignNodeZIndex(root, childrenByGroupMap, 0, zIndexConfig);
    nodes.push(...result.nodes);
    for (const [id, elev] of result.elevations) {
      elevations.set(id, elev);
    }
  }

  return { nodes, elevations };
}

/**
 * Lightweight variant without cloning nodes that computes only non-elevated z-index values.
 */
export function initializeBaseZIndices(
  nodesMap: Map<string, Node>,
  childrenByGroupId?: Map<string, Node[]>,
  zIndexConfig?: ZIndexConfig
): Map<string, number> {
  const rootNodes = Array.from(nodesMap.values()).filter((node) => node.groupId == null);
  const childrenByGroupMap = childrenByGroupId ?? createGroupChildrenMap(nodesMap);
  const result = new Map<string, number>();

  for (const root of rootNodes) {
    for (const [id, z] of computeNodeBaseZIndices(root, childrenByGroupMap, 0, zIndexConfig)) {
      result.set(id, z);
    }
  }

  return result;
}
