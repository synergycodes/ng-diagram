import { Edge, Node } from '../../../../types';

export function assignEdgesZIndex(
  edges: Edge[],
  nodesWithZIndex: Node[],
  nodesMap: Map<string, Node>,
  edgesAboveConnectedNodes = false
): Edge[] {
  const zIndexMap = new Map(nodesWithZIndex.map((n) => [n.id, n.zIndex ?? 0]));

  return edges.map((edge) => assignEdgeZIndex(edge, zIndexMap, nodesMap, edgesAboveConnectedNodes));
}

export function assignEdgeZIndex(
  edge: Edge,
  zIndexMap: Map<string, number>,
  nodesMap: Map<string, Node>,
  edgesAboveConnectedNodes = false
): Edge {
  const sourceZ = zIndexMap.get(edge.source) ?? nodesMap.get(edge.source)?.zIndex ?? 0;
  const targetZ = zIndexMap.get(edge.target) ?? nodesMap.get(edge.target)?.zIndex ?? 0;
  const baseZIndex = Math.max(sourceZ, targetZ);
  const zIndex = edge?.zOrder ?? (edgesAboveConnectedNodes ? baseZIndex + 1 : baseZIndex);

  return {
    ...edge,
    zIndex,
  };
}
