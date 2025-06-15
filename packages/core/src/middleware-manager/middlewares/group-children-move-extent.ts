import type { Middleware, Node } from '../../types';
import { calculateGroupRect } from '../../utils/get-group-bounds';

export const groupChildrenMoveExtent: Middleware = {
  name: 'group-children-move-extent',
  execute: async ({ helpers, nodesMap, flowCore }, next) => {
    const shouldRun = helpers.checkIfAnyNodePropsChanged(['position', 'size']);

    if (!shouldRun) {
      next();
      return;
    }
    const affectedGroupNodes = new Set<Node>();
    const affectedNodes = helpers.getAffectedNodeIds(['position', 'size']);

    for (const nodeId of affectedNodes) {
      const node = nodesMap.get(nodeId);

      if (!node) continue;
      if (node.groupId) {
        const group = nodesMap.get(node.groupId);

        if (group && group.isGroup) {
          affectedGroupNodes.add(group);
        }
      }
    }

    const nodesToUpdate = [] as {
      id: string;
      position: Node['position'];
      size: Required<Node>['size'];
      autoSize: boolean;
    }[];

    const groupsToUpdate = [...affectedGroupNodes].sort((a, b) => (a.zOrder ?? 0) - (b.zOrder ?? 0));

    for (const group of groupsToUpdate) {
      /**
       * NOTE: We don't return children nodes directly
       * The model lookup is not updated yet -> get nodes data from nodesMap
       * which are updated but not yet pushed to the state
       * TODO: support nested groups
       */
      const groupChildren = flowCore.modelLookup.getNodeChildrenIds(group.id, { directOnly: true });

      if (groupChildren.length === 0) continue;

      const groupRect = calculateGroupRect(
        groupChildren.map((id) => nodesMap.get(id)!),
        group
      );

      nodesToUpdate.push({
        id: group.id,
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
