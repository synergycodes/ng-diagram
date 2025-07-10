import { Node } from '../../../../types';

/**
 * Recursively assigns zOrder to the given node and its children, returning a flat array of nodes with assigned zOrder.
 *
 * @param {Node} node - The starting node.
 * @param {Map<string, Node>} nodesMap - Map of all nodes by id.
 * @param {number} currentZOrder - The starting zOrder value.
 * @returns {Node[]} Flat array of nodes with assigned zOrder.
 */
export function assignNodeZOrder(node: Node, nodesMap: Map<string, Node>, currentZOrder: number): Node[] {
  const childrenByGroupId = createGroupChildrenMap(nodesMap);

  const nodesWithZOrder: Node[] = [];

  function assignZOrder(currentNode: Node, zOrder: number): number {
    const nodeWithZOrder: Node = { ...currentNode, zOrder };
    nodesWithZOrder.push(nodeWithZOrder);

    let currentZOrder = zOrder;

    if (currentNode.isGroup) {
      const childNodes = childrenByGroupId.get(currentNode.id) || [];

      for (const childNode of childNodes) {
        currentZOrder += 1;
        currentZOrder = assignZOrder(childNode, currentZOrder);
      }
    }

    return currentZOrder;
  }

  assignZOrder(node, currentZOrder);

  return nodesWithZOrder;
}

/**
 * Builds a map from group id to an array of its child nodes.
 */
function createGroupChildrenMap(nodesMap: Map<string, Node>): Map<string, Node[]> {
  const groupMap = new Map<string, Node[]>();

  for (const node of nodesMap.values()) {
    if (node.groupId) {
      if (!groupMap.has(node.groupId)) {
        groupMap.set(node.groupId, []);
      }
      groupMap.get(node.groupId)!.push(node);
    }
  }
  return groupMap;
}
