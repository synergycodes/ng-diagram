import { FlowCore } from '../../flow-core';
import type { Middleware, MiddlewareContext, Node } from '../../types';
import { calculateGroupRect } from '../../utils/get-group-bounds';

interface NodeUpdate {
  id: string;
  position: Node['position'];
  size: Required<Node>['size'];
  autoSize: boolean;
}

export const groupChildrenMoveExtent: Middleware = {
  name: 'group-children-move-extent',
  execute: async ({ helpers, nodesMap, flowCore }, next) => {
    // Early exit if no relevant changes
    if (!helpers.checkIfAnyNodePropsChanged(['position', 'size'])) {
      next();
      return;
    }

    const affectedGroups = findAffectedGroups(helpers, nodesMap);
    if (affectedGroups.size === 0) {
      next();
      return;
    }

    const updates = calculateGroupUpdates(affectedGroups, nodesMap, flowCore);

    if (updates.length > 0) {
      next({ nodesToUpdate: updates });
    } else {
      next();
    }
  },
};

/**
 * Find all groups that are affected by node position/size changes
 */
function findAffectedGroups(helpers: MiddlewareContext['helpers'], nodesMap: Map<string, Node>): Set<Node> {
  const affectedGroups = new Set<Node>();
  const changedNodeIds = helpers.getAffectedNodeIds(['position', 'size']);

  for (const nodeId of changedNodeIds) {
    const node = nodesMap.get(nodeId);
    if (!node?.groupId) continue;

    const group = nodesMap.get(node.groupId);
    if (group?.isGroup) {
      affectedGroups.add(group);
    }
  }

  return affectedGroups;
}

/**
 * Calculate all necessary updates for groups and their ancestors
 */
function calculateGroupUpdates(
  affectedGroups: Set<Node>,
  nodesMap: Map<string, Node>,
  flowCore: FlowCore
): NodeUpdate[] {
  const updates: NodeUpdate[] = [];
  const processedNodeIds = new Set<string>();
  const sortedGroups = [...affectedGroups].sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));

  // Create a working copy of the nodes map for incremental updates
  const workingNodesMap = new Map(nodesMap);

  for (const group of sortedGroups) {
    const groupUpdates = updateGroupHierarchy(group, workingNodesMap, flowCore, processedNodeIds);
    updates.push(...groupUpdates);

    // Apply updates to working map for next iteration
    applyUpdatesToWorkingMap(groupUpdates, workingNodesMap);
  }

  return updates;
}

/**
 * Update a group and all its ancestors with new bounds
 */
function updateGroupHierarchy(
  group: Node,
  workingNodesMap: Map<string, Node>,
  flowCore: FlowCore,
  processedNodeIds: Set<string>
): NodeUpdate[] {
  const updates: NodeUpdate[] = [];

  // Get the hierarchy from bottom to top (group -> ancestors)
  const hierarchy = [group, ...flowCore.modelLookup.getParentChain(group.id)];

  for (const currentGroup of hierarchy) {
    // Skip if this node has already been processed (on-the-fly deduplication)
    if (processedNodeIds.has(currentGroup.id)) {
      continue;
    }

    const children = flowCore.modelLookup.getNodeChildrenIds(currentGroup.id, { directOnly: true });

    if (children.length === 0) continue;

    const childNodes = children.map((id: string) => workingNodesMap.get(id)!).filter(Boolean);

    const groupRect = calculateGroupRect(childNodes, currentGroup);

    const update: NodeUpdate = {
      id: currentGroup.id,
      position: { x: groupRect.x, y: groupRect.y },
      size: { width: groupRect.width, height: groupRect.height },
      autoSize: false,
    };

    updates.push(update);
    processedNodeIds.add(currentGroup.id); // Mark as processed
  }

  return updates;
}

/**
 * Apply updates to the working nodes map for subsequent calculations
 */
function applyUpdatesToWorkingMap(updates: NodeUpdate[], workingNodesMap: Map<string, Node>): void {
  for (const update of updates) {
    const existingNode = workingNodesMap.get(update.id);
    if (existingNode) {
      workingNodesMap.set(update.id, {
        ...existingNode,
        position: update.position,
        size: update.size,
        autoSize: update.autoSize,
      });
    }
  }
}
