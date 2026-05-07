import { Node, ZIndexConfig } from '../../../../types';
import { isGroup } from '../../../../utils';
import { sortChildren } from './sort-children';

export interface AssignNodeZIndexResult {
  /** Cloned nodes with computedZIndex assigned */
  nodes: Node[];
  /** Cumulative elevation per node — 0 for non-elevated, selectedZIndex for selected, 2*selectedZIndex for selected under selected parent, etc. */
  elevations: Map<string, number>;
}

/**
 * Recursively assigns computedZIndex to a node and its children.
 *
 * Elevation: each selected node adds selectedZIndex to cumulative elevation.
 * Children inherit the parent's cumulative elevation and may add their own.
 *
 * Sorting: children are sorted by selection status (selected last), then by zOrder.
 *
 * Z-index rules:
 * - Grouped nodes: `Math.max(zOrder ?? slot, slot)` — zOrder is a minimum floor, slot ensures above parent
 * - Root nodes: `zOrder ?? slot` — zOrder used directly, including negative values
 * - Each child gets an independent slot from the parent; a child's internal zOrder jump doesn't inflate siblings
 */
export function assignNodeZIndex(
  node: Node,
  childrenByGroupId: Map<string, Node[]>,
  baseZIndex: number,
  zIndexConfig?: ZIndexConfig,
  options?: { initialCumulativeElevation?: number; skipRoot?: boolean }
): AssignNodeZIndexResult {
  const nodes: Node[] = [];
  const elevations = new Map<string, number>();
  const skipId = options?.skipRoot ? node.id : undefined;

  traverseNodes(
    node,
    childrenByGroupId,
    baseZIndex,
    zIndexConfig,
    (currentNode, computedZIndex, cumulativeElevation) => {
      if (currentNode.id === skipId) return;
      nodes.push({ ...currentNode, computedZIndex });
      elevations.set(currentNode.id, cumulativeElevation);
    },
    false,
    options?.initialCumulativeElevation ?? 0
  );

  return { nodes, elevations };
}

/**
 * Lightweight variant that computes only the non-elevated z-index per node.
 * No node cloning — returns Map<nodeId, nonElevatedZIndex>.
 *
 * Uses `ignoreSelection` mode internally — both elevation and selection-aware sorting
 * are skipped, so selection state has zero influence on the computed base positions.
 */
export function computeNodeBaseZIndices(
  node: Node,
  childrenByGroupId: Map<string, Node[]>,
  baseZIndex: number,
  zIndexConfig?: ZIndexConfig
): Map<string, number> {
  const result = new Map<string, number>();

  traverseNodes(
    node,
    childrenByGroupId,
    baseZIndex,
    zIndexConfig,
    (_currentNode, computedZIndex) => {
      result.set(_currentNode.id, computedZIndex);
    },
    true
  );

  return result;
}

type NodeVisitor = (currentNode: Node, computedZIndex: number, cumulativeElevation: number) => void;

/**
 * Core DFS traversal shared by assignNodeZIndex and computeNodeBaseZIndices.
 *
 * For each node:
 * 1. Computes non-elevated z-index: grouped = Math.max(zOrder ?? slot, slot), root = zOrder ?? slot
 * 2. Adds selectedZIndex to cumulative elevation if node is selected and elevation is enabled
 * 3. Calls visitor with final computedZIndex (nonElevated + cumulativeElevation)
 * 4. Recurses into sorted children, each getting an independent incrementing slot
 *
 * The slot counter (childSlot) advances by 1 per child regardless of the child's internal z-index.
 * This ensures a child's high zOrder doesn't inflate sibling positions at the parent level.
 */
function traverseNodes(
  node: Node,
  childrenByGroupId: Map<string, Node[]>,
  baseZIndex: number,
  zIndexConfig: ZIndexConfig | undefined,
  visitor: NodeVisitor,
  ignoreSelection = false,
  initialCumulativeElevation = 0
): void {
  const elevationAmount = !ignoreSelection && zIndexConfig?.elevateOnSelection ? zIndexConfig.selectedZIndex : 0;
  const visited = new Set<string>();

  function traverse(currentNode: Node, zIndex: number, cumulativeElevation: number): void {
    if (visited.has(currentNode.id)) return;
    visited.add(currentNode.id);

    const nonElevatedZ =
      currentNode.groupId != null ? Math.max(currentNode.zOrder ?? zIndex, zIndex) : (currentNode.zOrder ?? zIndex);

    if (currentNode.selected && elevationAmount > 0) {
      cumulativeElevation += elevationAmount;
    }

    visitor(currentNode, nonElevatedZ + cumulativeElevation, cumulativeElevation);

    if (isGroup(currentNode)) {
      let childSlot = nonElevatedZ;
      for (const childNode of sortChildren(childrenByGroupId.get(currentNode.id) || [], ignoreSelection)) {
        childSlot += 1;
        traverse(childNode, childSlot, cumulativeElevation);
      }
    }
  }

  traverse(node, baseZIndex, initialCumulativeElevation);
}
