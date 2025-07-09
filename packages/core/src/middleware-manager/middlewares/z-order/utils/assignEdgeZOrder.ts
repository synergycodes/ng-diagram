import { Edge, Node } from '../../../../types';

export function assignEdgeZOrder(edges: Edge[], nodesWithZOrder: Node[], nodesMap: Map<string, Node>): Edge[] {
  const zOrderMap = new Map(nodesWithZOrder.map((n) => [n.id, n.zOrder ?? 0]));

  return edges.map((edge) => {
    const sourceZ = zOrderMap.get(edge.source) ?? nodesMap.get(edge.source)?.zOrder ?? 0;
    const targetZ = zOrderMap.get(edge.target) ?? nodesMap.get(edge.target)?.zOrder ?? 0;
    const zOrder = Math.max(sourceZ, targetZ);

    return {
      ...edge,
      zOrder,
    };
  });
}
