import { Edge, Node } from '../../../../types';

export function assignEdgesZIndex(edges: Edge[], nodesWithZIndex: Node[], nodesMap: Map<string, Node>): Edge[] {
  const zIndexMap = new Map(nodesWithZIndex.map((n) => [n.id, n.zIndex ?? 0]));

  return edges.map((edge) => assignEdgeZIndex(edge, zIndexMap, nodesMap));
}

export function assignEdgeZIndex(edge: Edge, zIndexMap: Map<string, number>, nodesMap: Map<string, Node>): Edge {
  const sourceZ = zIndexMap.get(edge.source) ?? nodesMap.get(edge.source)?.zIndex ?? 0;
  const targetZ = zIndexMap.get(edge.target) ?? nodesMap.get(edge.target)?.zIndex ?? 0;
  const zIndex = edge?.zOrder ?? Math.max(sourceZ, targetZ);

  return {
    ...edge,
    zIndex,
  };
}
