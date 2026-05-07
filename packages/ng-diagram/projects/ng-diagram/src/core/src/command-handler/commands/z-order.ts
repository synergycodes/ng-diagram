import { createGroupChildrenMap } from '../../middleware-manager/middlewares/z-index-assignment/utils/create-group-children-map';
import { initializeBaseZIndices } from '../../middleware-manager/middlewares/z-index-assignment/utils/initialize-z-index';
import { collectIdsInHierarchyOrder } from '../../middleware-manager/middlewares/z-index-assignment/utils/sort-children';
import { CommandHandler, Edge, Node } from '../../types';

/**
 * Collects all descendants of the given node IDs (including the IDs themselves) via BFS.
 */
function collectDescendantIds(nodeIds: string[], childrenByGroupId: Map<string, Node[]>): Set<string> {
  const ids = new Set(nodeIds);
  const queue = [...nodeIds];
  while (queue.length > 0) {
    for (const child of childrenByGroupId.get(queue.pop()!) ?? []) {
      if (!ids.has(child.id)) {
        ids.add(child.id);
        queue.push(child.id);
      }
    }
  }
  return ids;
}

/**
 * Filters target node IDs to root-level targets — nodes that have no ancestor
 * in the target set.
 */
function filterToRootTargets(nodeIds: string[], nodesById: Map<string, Node>): string[] {
  const targetSet = new Set(nodeIds);
  return nodeIds.filter((id) => {
    const visited = new Set<string>();
    let ancestorId = nodesById.get(id)?.groupId;
    while (ancestorId != null && !visited.has(ancestorId)) {
      if (targetSet.has(ancestorId)) return false;
      visited.add(ancestorId);
      ancestorId = nodesById.get(ancestorId)?.groupId;
    }
    return true;
  });
}

/**
 * Walks up the groupId chain from immediate parent to root.
 * Only called for K target nodes during sendToBack.
 */
function collectAncestorIds(nodeId: string, nodesById: Map<string, Node>): string[] {
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = nodesById.get(nodeId);
  while (current?.groupId != null && !visited.has(current.groupId)) {
    visited.add(current.groupId);
    ancestors.push(current.groupId);
    current = nodesById.get(current.groupId);
  }
  return ancestors;
}

/**
 * Computes the new zOrder value by finding the max (bringToFront) or min (sendToBack)
 * of all non-excluded node base z-indices and edge zOrders, then adding/subtracting 1.
 *
 * Base z-indices are computed in-memory without elevation, so selection state
 * doesn't inflate the result.
 *
 * Only edge `zOrder` is considered (not `computedZIndex`) because edges without `zOrder`
 * derive their z-index from connected nodes, which are already counted via node values.
 * Edge `zOrder` represents an explicit user override independent of connected nodes.
 */
function computeZOrder(
  nodeBaseZIndices: Map<string, number>,
  edges: Edge[],
  isBringToFront: boolean,
  excludeNodeIds: Set<string>,
  excludeEdgeIds: Set<string>
): number {
  let result = 0;

  for (const [id, baseZ] of nodeBaseZIndices) {
    if (excludeNodeIds.has(id)) continue;
    result = isBringToFront ? Math.max(result, baseZ) : Math.min(result, baseZ);
  }

  for (const edge of edges) {
    if (excludeEdgeIds.has(edge.id)) continue;
    const edgeZ = edge.zOrder ?? 0;
    result = isBringToFront ? Math.max(result, edgeZ) : Math.min(result, edgeZ);
  }

  return isBringToFront ? result + 1 : result - 1;
}

/**
 * Resolves the target node and edge IDs for the command.
 * Uses explicitly provided IDs if available, otherwise falls back to the current selection.
 */
function getCommandTarget(
  nodes: Node[],
  edges: Edge[],
  command: BringToFrontCommand | SendToBackCommand
): {
  nodeIds: string[];
  edgeIds: string[];
} {
  if (command.nodeIds || command.edgeIds) {
    return { nodeIds: command.nodeIds ?? [], edgeIds: command.edgeIds ?? [] };
  }

  return {
    nodeIds: nodes.filter((node) => node.selected).map((node) => node.id),
    edgeIds: edges.filter((edge) => edge.selected).map((edge) => edge.id),
  };
}

export interface BringToFrontCommand {
  name: 'bringToFront';
  nodeIds?: string[];
  edgeIds?: string[];
}

export interface SendToBackCommand {
  name: 'sendToBack';
  nodeIds?: string[];
  edgeIds?: string[];
}

/**
 * Core logic for bringToFront and sendToBack commands.
 *
 * Computes non-elevated base z-indices in memory (via initializeZIndex with elevation disabled),
 * then determines the new zOrder value that places targets above/below all other elements.
 *
 * For bringToFront:
 * - Root-level targets (filtered via filterToRootTargets) each receive the same base zOrder.
 * - Each root target's descendants receive incrementing zOrder in hierarchy order
 *   (sorted by zOrder, ignoring selection) to preserve internal structure.
 * - Root targets + descendants are excluded from the max calculation to avoid self-inflation.
 *
 * For sendToBack:
 * - All target nodes receive the computed zOrder
 * - Ancestors of each target receive progressively lower zOrder (parent = zOrder-1,
 *   grandparent = zOrder-2, etc.) ensuring the entire parent chain is sent behind
 *   its siblings at each level. When multiple targets share an ancestor, the lowest value wins.
 *
 * Target edges receive the same zOrder as target nodes.
 */
const changeZOrder = async (
  commandHandler: CommandHandler,
  command: BringToFrontCommand | SendToBackCommand
): Promise<void> => {
  const { nodes, edges } = commandHandler.flowCore.getState();
  const { nodeIds: targetNodeIds, edgeIds: targetEdgeIds } = getCommandTarget(nodes, edges, command);
  if (targetNodeIds.length === 0 && targetEdgeIds.length === 0) {
    return;
  }

  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const childrenByGroupId = createGroupChildrenMap(nodesById);

  const zIndexConfig = commandHandler.flowCore.config.zIndex;
  const nodeBaseZIndices = initializeBaseZIndices(nodesById, childrenByGroupId, zIndexConfig);

  const rootTargetNodeIds = filterToRootTargets(targetNodeIds, nodesById);
  const excludeNodeIds = collectDescendantIds(rootTargetNodeIds, childrenByGroupId);
  const excludeEdgeIds = new Set(targetEdgeIds);
  const isBringToFront = command.name === 'bringToFront';

  const zOrder = computeZOrder(nodeBaseZIndices, edges, isBringToFront, excludeNodeIds, excludeEdgeIds);

  const nodesToUpdate: { id: string; zOrder: number }[] = [];

  if (isBringToFront) {
    // Each root target gets the same zOrder. Descendants within each subtree
    // get incrementing zOrder in hierarchy order (sorted by zOrder, ignoring selection).
    for (const rootId of rootTargetNodeIds) {
      const orderedIds = collectIdsInHierarchyOrder([rootId], nodesById, childrenByGroupId, true);
      let nextZOrder = zOrder;
      for (const id of orderedIds) {
        nodesToUpdate.push({ id, zOrder: nextZOrder });
        nextZOrder += 1;
      }
    }
  } else {
    // Each target gets zOrder. Ancestors get progressively lower zOrder
    // so the entire parent chain is sent behind its siblings.
    const ancestorZOrders = new Map<string, number>();
    for (const id of targetNodeIds) {
      nodesToUpdate.push({ id, zOrder });
      const ancestors = collectAncestorIds(id, nodesById);
      let ancestorZOrder = zOrder;
      for (const ancestorId of ancestors) {
        ancestorZOrder -= 1;
        const existing = ancestorZOrders.get(ancestorId);
        if (existing == null || ancestorZOrder < existing) {
          ancestorZOrders.set(ancestorId, ancestorZOrder);
        }
      }
    }
    for (const [id, z] of ancestorZOrders) {
      nodesToUpdate.push({ id, zOrder: z });
    }
  }

  await commandHandler.flowCore.applyUpdate(
    {
      nodesToUpdate,
      edgesToUpdate: targetEdgeIds.map((id) => ({ id, zOrder })),
    },
    'changeZOrder'
  );
};

/** Brings the specified nodes and edges to the front (highest z-index). Targets current selection if no IDs provided. */
export const bringToFront = async (commandHandler: CommandHandler, command: BringToFrontCommand) => {
  await changeZOrder(commandHandler, command);
};

/** Sends the specified nodes and edges to the back (lowest z-index). Targets current selection if no IDs provided. */
export const sendToBack = async (commandHandler: CommandHandler, command: SendToBackCommand) => {
  await changeZOrder(commandHandler, command);
};
