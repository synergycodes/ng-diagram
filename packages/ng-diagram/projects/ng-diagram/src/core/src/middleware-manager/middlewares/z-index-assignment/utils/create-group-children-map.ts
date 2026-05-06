import { Node } from '../../../../types';

/**
 * Builds a lookup map from group ID to its direct child nodes.
 * Only includes nodes with a non-null `groupId`. Root nodes (no groupId) are excluded.
 * Groups with no children will not have an entry in the map.
 */
export function createGroupChildrenMap(nodesMap: Map<string, Node>): Map<string, Node[]> {
  const groupMap = new Map<string, Node[]>();

  for (const node of nodesMap.values()) {
    if (node.groupId != null) {
      if (!groupMap.has(node.groupId)) {
        groupMap.set(node.groupId, []);
      }
      groupMap.get(node.groupId)!.push(node);
    }
  }
  return groupMap;
}
