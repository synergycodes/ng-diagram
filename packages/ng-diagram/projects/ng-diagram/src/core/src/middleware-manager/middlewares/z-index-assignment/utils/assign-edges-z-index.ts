import { Edge, Node } from '../../../../types';

/**
 * Assigns computedZIndex to all edges based on their connected nodes.
 * Builds a z-index lookup from `nodesWithZIndex`, then delegates to `assignEdgeZIndex` per edge.
 */
export function assignEdgesZIndex(
  edges: Edge[],
  nodesWithZIndex: Node[],
  nodesMap: Map<string, Node>,
  edgesAboveConnectedNodes = false
): Edge[] {
  const zIndexMap = new Map(nodesWithZIndex.map((n) => [n.id, n.computedZIndex ?? 0]));

  return edges.map((edge) => assignEdgeZIndex(edge, zIndexMap, nodesMap, edgesAboveConnectedNodes));
}

/**
 * Computes computedZIndex for a single edge.
 *
 * Base z-index = max(source, target) from `zIndexMap`, falling back to `nodesMap.computedZIndex`, then 0.
 * If `edgesAboveConnectedNodes` is true, base is incremented by 1.
 * Explicit `edge.zOrder` overrides the computed base entirely.
 *
 * Note: selection elevation is NOT applied here — it's handled by the middleware
 * which adds connected node elevation for edges with `zOrder`, and own `selectedZIndex` for selected edges.
 */
export function assignEdgeZIndex(
  edge: Edge,
  zIndexMap: Map<string, number>,
  nodesMap: Map<string, Node>,
  edgesAboveConnectedNodes = false
): Edge {
  const sourceZ = zIndexMap.get(edge.source) ?? nodesMap.get(edge.source)?.computedZIndex ?? 0;
  const targetZ = zIndexMap.get(edge.target) ?? nodesMap.get(edge.target)?.computedZIndex ?? 0;
  const baseZIndex = Math.max(sourceZ, targetZ);
  const zIndex = edge.zOrder ?? (edgesAboveConnectedNodes ? baseZIndex + 1 : baseZIndex);

  return {
    ...edge,
    computedZIndex: zIndex,
  };
}
