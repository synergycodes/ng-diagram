import type { Node } from '../../types';

/**
 * Gets the specified nodes and all their descendants from a nodes map.
 *
 * Builds a parent→children index and recursively collects all descendants,
 * with deduplication.
 *
 * @param nodeIds - IDs of the root nodes to collect
 * @param nodesMap - Map of node ID to Node
 * @returns Array of the specified nodes and all their descendants
 */
export function getNodesWithChildren(nodeIds: string[], nodesMap: Map<string, Node>): Node[] {
  const childrenByGroupId = new Map<string, Node[]>();
  for (const node of nodesMap.values()) {
    if (node.groupId != null) {
      let children = childrenByGroupId.get(node.groupId);
      if (!children) {
        children = [];
        childrenByGroupId.set(node.groupId, children);
      }
      children.push(node);
    }
  }

  const collected = new Set<string>();
  const result: Node[] = [];

  const collect = (node: Node) => {
    if (collected.has(node.id)) return;
    collected.add(node.id);
    result.push(node);

    const children = childrenByGroupId.get(node.id);
    if (children) {
      for (const child of children) {
        collect(child);
      }
    }
  };

  for (const nodeId of nodeIds) {
    const node = nodesMap.get(nodeId);
    if (node) {
      collect(node);
    }
  }

  return result;
}
