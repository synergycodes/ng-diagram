import { Node } from '../../../../types';
import { isGroup } from '../../../../utils';

export function initializeZIndex(nodesMap: Map<string, Node>): Node[] {
  const rootNodes = Array.from(nodesMap.values()).filter((node) => !node.groupId);
  const nodesWithZIndex: Node[] = [];

  for (const root of rootNodes) {
    assignZIndex(root, nodesMap, nodesWithZIndex, 0);
  }

  return nodesWithZIndex;
}

function assignZIndex(node: Node, nodesMap: Map<string, Node>, output: Node[], currentZIndex: number) {
  const zIndex = node?.zOrder ?? currentZIndex;
  output.push({ ...node, zIndex: zIndex });

  if (!isGroup(node)) return;

  const children = Array.from(nodesMap.values()).filter((n) => n.groupId === node.id);

  for (const child of children) {
    assignZIndex(child, nodesMap, output, currentZIndex + 1);
  }
}
