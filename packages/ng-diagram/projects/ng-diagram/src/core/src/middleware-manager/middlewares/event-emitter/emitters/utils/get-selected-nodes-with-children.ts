import type { Node } from '../../../../../types';

/**
 * Gets all selected nodes and their descendants, filtered by draggable.
 * Mirrors the logic of ModelLookup.getSelectedNodesWithChildren({ directOnly: false })
 * but operates on a nodesMap from middleware context.
 */
export function getSelectedNodesWithChildren(nodesMap: Map<string, Node>): Node[] {
  const allNodes = [...nodesMap.values()];
  const selectedNodes = allNodes.filter((node) => node.selected);

  // Build parent→children index
  const childrenByGroupId = new Map<string, Node[]>();
  for (const node of allNodes) {
    if (node.groupId) {
      let children = childrenByGroupId.get(node.groupId);
      if (!children) {
        children = [];
        childrenByGroupId.set(node.groupId, children);
      }
      children.push(node);
    }
  }

  // Collect selected nodes + all descendants
  const collected = new Set<string>();
  const result: Node[] = [];

  const collect = (node: Node) => {
    if (collected.has(node.id)) return;
    collected.add(node.id);

    if (node.draggable ?? true) {
      result.push(node);
    }

    const children = childrenByGroupId.get(node.id);
    if (children) {
      for (const child of children) {
        collect(child);
      }
    }
  };

  for (const node of selectedNodes) {
    collect(node);
  }

  return result;
}
