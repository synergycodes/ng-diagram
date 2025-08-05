import { FlowCore } from '../../flow-core';
import type { GroupNode, Middleware, MiddlewareContext, Node } from '../../types';
import { calculateGroupRect, isGroup } from '../../utils';

export interface GroupChildrenMoveExtentMiddlewareMetadata {
  enabled: boolean;
}

interface NodeUpdate {
  id: string;
  position: Node['position'];
  size: Required<Node>['size'];
  autoSize: boolean;
}

export const groupChildrenMoveExtent: Middleware<
  'group-children-move-extent',
  GroupChildrenMoveExtentMiddlewareMetadata
> = {
  name: 'group-children-move-extent',
  defaultMetadata: {
    enabled: true,
  },
  execute: ({ helpers, nodesMap, flowCore, middlewareMetadata }, next) => {
    const isEnabled = middlewareMetadata.enabled;

    if (!isEnabled) {
      next();
      return;
    }

    // Early exit if no relevant changes (including rotation)
    if (!helpers.checkIfAnyNodePropsChanged(['position', 'size', 'angle'])) {
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
 * Find all groups that are affected by node position/size/angle changes
 */
function findAffectedGroups(helpers: MiddlewareContext['helpers'], nodesMap: Map<string, Node>): Set<GroupNode> {
  const affectedGroups = new Set<GroupNode>();
  const changedNodeIds = helpers.getAffectedNodeIds(['position', 'size', 'angle']);

  for (const nodeId of changedNodeIds) {
    const node = nodesMap.get(nodeId);
    if (!node?.groupId) continue;

    const group = nodesMap.get(node.groupId);

    if (group && isGroup(group)) {
      affectedGroups.add(group);
    }
  }

  return affectedGroups;
}

/**
 * Calculate all necessary updates for groups and their ancestors
 */
function calculateGroupUpdates(
  affectedGroups: Set<GroupNode>,
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
  }

  return updates;
}

/**
 * Update a group and all its ancestors with new bounds
 * It's like bubbling the update up the hierarchy
 */
function updateGroupHierarchy(
  group: GroupNode,
  workingNodesMap: Map<string, Node>,
  flowCore: FlowCore,
  processedNodeIds: Set<string>
): NodeUpdate[] {
  const updates: NodeUpdate[] = [];

  // Get the hierarchy from bottom to top (group -> ancestors)
  const hierarchy = [group, ...flowCore.modelLookup.getParentChain(group.id)];

  for (const currentGroup of hierarchy) {
    const children = flowCore.modelLookup.getNodeChildrenIds(currentGroup.id, { directOnly: true });

    if (children.length === 0) continue;

    const childNodes = children.map((id: string) => workingNodesMap.get(id)!);

    const groupRect = calculateGroupRect(childNodes, currentGroup);

    const update: NodeUpdate = {
      id: currentGroup.id,
      position: { x: groupRect.x, y: groupRect.y },
      size: { width: groupRect.width, height: groupRect.height },
      autoSize: false,
    };

    // Always update the working map for subsequent calculations
    const existingNode = workingNodesMap.get(currentGroup.id);
    if (existingNode) {
      workingNodesMap.set(currentGroup.id, {
        ...existingNode,
        position: update.position,
        size: update.size,
        autoSize: update.autoSize,
      });
    }

    // Only add to results if not already processed (keep first occurrence)
    if (!processedNodeIds.has(currentGroup.id)) {
      updates.push(update);
      processedNodeIds.add(currentGroup.id);
    }
  }

  return updates;
}
