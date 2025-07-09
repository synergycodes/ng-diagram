import { Node } from '../../../../types';

export function assignNodeZOrder(
  node: Node,
  nodesMap: Map<string, Node>,
  nodesWithZOrder: Node[],
  currentZOrder: number
) {
  nodesWithZOrder.push({ ...node, zOrder: currentZOrder });

  let nextZOrder = currentZOrder;

  if (node.isGroup) {
    const children = Array.from(nodesMap.values()).filter((n) => n.groupId === node.id);
    for (const child of children) {
      nextZOrder++;
      nextZOrder = assignNodeZOrder(child, nodesMap, nodesWithZOrder, nextZOrder);
    }
  }

  return nextZOrder;
}
