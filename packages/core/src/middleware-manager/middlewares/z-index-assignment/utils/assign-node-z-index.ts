import { Node } from '../../../../types';

/**
 * Recursively assigns zIndex to the given node and its children, returning a flat array of nodes with assigned zIndex.
 *
 * @param {Node} node - The starting node.
 * @param {Map<string, Node>} nodesMap - Map of all nodes by id.
 * @param {number} currentZIndex - The starting zIndex value.
 * @param selected
 * @returns {Node[]} Flat array of nodes with assigned zIndex.
 */
export function assignNodeZIndex(
  node: Node,
  nodesMap: Map<string, Node>,
  currentZIndex: number,
  selected?: boolean
): Node[] {
  const childrenByGroupId = createGroupChildrenMap(nodesMap);

  const nodesWithZIndex: Node[] = [];

  function assignZIndex(currentNode: Node, zIndex: number, selected?: boolean): number {
    const nodeWithZIndex: Node = { ...currentNode, zIndex: selected ? (currentNode?.zOrder ?? zIndex) : zIndex };
    nodesWithZIndex.push(nodeWithZIndex);

    let currentZIndex = zIndex;

    if (currentNode.isGroup) {
      const childNodes = childrenByGroupId.get(currentNode.id) || [];

      for (const childNode of childNodes) {
        currentZIndex += 1;
        currentZIndex = assignZIndex(childNode, currentZIndex, selected);
      }
    }

    return currentZIndex;
  }

  assignZIndex(node, currentZIndex, selected);

  return nodesWithZIndex;
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
