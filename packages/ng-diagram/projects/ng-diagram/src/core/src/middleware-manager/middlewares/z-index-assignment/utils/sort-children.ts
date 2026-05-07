import { Node } from '../../../../types';

/**
 * Sorts group children by selection status first (selected last), then by zOrder.
 * When `ignoreSelection` is true, sorts only by zOrder.
 * Returns a new sorted array without mutating the input.
 */
export function sortChildren(children: Node[], ignoreSelection = false): Node[] {
  return [...children].sort((a, b) => {
    if (!ignoreSelection) {
      const selA = a.selected ? 1 : 0;
      const selB = b.selected ? 1 : 0;
      if (selA !== selB) return selA - selB;
    }
    return (a.zOrder ?? 0) - (b.zOrder ?? 0);
  });
}

/**
 * Collects node IDs in hierarchy order: parent first, then children sorted
 * by zOrder (and optionally selection status), recursing into groups.
 */
export function collectIdsInHierarchyOrder(
  rootIds: string[],
  nodesById: Map<string, Node>,
  childrenByGroupId: Map<string, Node[]>,
  ignoreSelection = false
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();

  function traverse(nodeId: string): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodesById.get(nodeId);
    if (!node) return;
    result.push(nodeId);
    const children = childrenByGroupId.get(nodeId);
    if (children) {
      for (const child of sortChildren(children, ignoreSelection)) {
        traverse(child.id);
      }
    }
  }

  for (const id of rootIds) {
    traverse(id);
  }

  return result;
}
