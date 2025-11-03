import { FlowStateUpdate, Middleware, Node } from '../../../types';
import { getNodeMeasuredBounds } from '../../../utils/dimensions';

export const measuredBoundsMiddleware: Middleware<'measured-bounds'> = {
  name: 'measured-bounds',
  execute: (context, next) => {
    const { nodesMap, modelActionType, initialUpdate } = context;

    if (modelActionType === 'init') {
      const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];
      nodesMap.forEach((node) => {
        nodesToUpdate.push({
          id: node.id,
          measuredBounds: getNodeMeasuredBounds(node),
        });
      });

      next({
        ...(nodesToUpdate.length ? { nodesToUpdate } : {}),
      });
      return;
    }

    const nodesToAdd = initialUpdate.nodesToAdd?.map((node) => ({
      ...node,
      measuredBounds: getNodeMeasuredBounds(node),
    }));
    const nodesToUpdate = initialUpdate.nodesToUpdate?.map((update) => {
      if (update.position !== undefined || update.size !== undefined || update.measuredPorts !== undefined) {
        const existingNode = nodesMap.get(update.id);
        if (existingNode) {
          const updatedNode: Node = {
            ...existingNode,
            ...update,
          };
          const measuredBounds = getNodeMeasuredBounds(updatedNode);
          return {
            ...update,
            measuredBounds,
          };
        }
      }
      return update;
    });

    next({
      ...(nodesToAdd ? { nodesToAdd } : {}),
      ...(nodesToUpdate ? { nodesToUpdate } : {}),
    });
  },
};
