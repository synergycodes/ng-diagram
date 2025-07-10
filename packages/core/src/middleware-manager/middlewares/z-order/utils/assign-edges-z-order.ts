import { Edge, Node } from '../../../../types';

export function assignEdgesZOrder(edges: Edge[], nodesWithZOrder: Node[], nodesMap: Map<string, Node>): Edge[] {
  const zOrderMap = new Map(nodesWithZOrder.map((n) => [n.id, n.zOrder ?? 0]));

  return edges.map((edge) => assignEdgeZOrder(edge, zOrderMap, nodesMap));
}

export function assignEdgeZOrder(edge: Edge, zOrderMap: Map<string, number>, nodesMap: Map<string, Node>): Edge {
  const sourceZ = zOrderMap.get(edge.source) ?? nodesMap.get(edge.source)?.zOrder ?? 0;
  const targetZ = zOrderMap.get(edge.target) ?? nodesMap.get(edge.target)?.zOrder ?? 0;
  const zOrder = edge?.userDefinedZOrder ?? Math.max(sourceZ, targetZ);

  return {
    ...edge,
    zOrder,
  };
}
