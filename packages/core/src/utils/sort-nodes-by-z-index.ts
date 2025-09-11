import type { Node } from '../types/node.interface';

/**
 * Sorts nodes by z-index from highest to lowest.
 * When z-indexes are equal, uses the node's position in the model array as a tiebreaker.
 * Nodes later in the model array are considered to have higher visual priority.
 *
 * @param nodes - Array of nodes to sort
 * @param modelNodes - The full model nodes array for determining relative positions
 * @returns A new sorted array with highest z-index first
 */
export function sortNodesByZIndex(nodes: Node[], modelNodes: Node[]): Node[] {
  const comparator = createNodeZIndexComparator(modelNodes);
  return [...nodes].sort(comparator);
}

/**
 * Creates a comparator function for sorting nodes by z-index.
 * When z-indexes are equal, uses the node's position in the model array as a tiebreaker.
 * Nodes later in the model array are considered to have higher visual priority.
 *
 * @param modelNodes - The full model nodes array for determining relative positions
 * @returns A comparator function for use with Array.sort() that sorts from highest to lowest z-index
 */
export function createNodeZIndexComparator(modelNodes: Node[]): (a: Node, b: Node) => number {
  const modelIndexMap = new Map<string, number>();
  modelNodes.forEach((node, index) => {
    modelIndexMap.set(node.id, index);
  });

  return (a: Node, b: Node): number => {
    const aZIndex = a.zIndex ?? 0;
    const bZIndex = b.zIndex ?? 0;

    if (aZIndex !== bZIndex) {
      return bZIndex - aZIndex;
    }

    const aModelIndex = modelIndexMap.get(a.id) ?? 0;
    const bModelIndex = modelIndexMap.get(b.id) ?? 0;

    return bModelIndex - aModelIndex;
  };
}
