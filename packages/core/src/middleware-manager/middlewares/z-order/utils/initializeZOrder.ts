import { Node } from '../../../../types';

export function initializeZOrder(nodesMap: Map<string, Node>): Node[] {
  const rootNodes = Array.from(nodesMap.values()).filter((node) => !node.groupId);
  const nodesWithZOrder: Node[] = [];

  for (const root of rootNodes) {
    assignZOrder(root, nodesMap, nodesWithZOrder, 0);
  }

  return nodesWithZOrder;
}

function assignZOrder(node: Node, nodesMap: Map<string, Node>, output: Node[], currentZOrder: number) {
  const clonedNode = { ...node, zOrder: currentZOrder };
  output.push(clonedNode);

  if (!node.isGroup) return;

  const children = Array.from(nodesMap.values()).filter((n) => n.groupId === node.id);

  for (const child of children) {
    assignZOrder(child, nodesMap, output, currentZOrder + 1);
  }
}
