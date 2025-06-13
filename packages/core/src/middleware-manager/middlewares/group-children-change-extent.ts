import type { Middleware, Node } from '../../types';
import { calculateGroupRect } from '../../utils/get-group-bounds';

export const groupChildrenChangeExtent: Middleware = {
  name: 'group-children-change-extent',
  execute: async ({ helpers, nodesMap }, next) => {
    const hasGroupChanges = helpers.checkIfAnyNodePropsChanged(['groupId']);

    if (!hasGroupChanges) {
      next();
      return;
    }
    const affectedGroupIds = new Set<string>();
    const affectedNodes = helpers.getAffectedNodeIds(['groupId']);

    for (const nodeId of affectedNodes) {
      const node = nodesMap.get(nodeId);

      if (!node) continue;
      if (node.groupId) affectedGroupIds.add(node.groupId);
    }

    const nodesToUpdate = [] as {
      id: string;
      position: Node['position'];
      size: Required<Node>['size'];
      autoSize: boolean;
    }[];

    for (const groupId of affectedGroupIds) {
      const group = nodesMap.get(groupId);
      if (!group || !group.isGroup) continue;

      const groupRect = calculateGroupRect(
        affectedNodes.map((id) => nodesMap.get(id)!),
        group
      );

      nodesToUpdate.push({
        id: groupId,
        position: { x: groupRect.x, y: groupRect.y },
        size: {
          width: groupRect.width,
          height: groupRect.height,
        },
        autoSize: false,
      });
    }

    if (nodesToUpdate.length > 0) {
      next({ nodesToUpdate });
    } else {
      next();
    }
  },
};
