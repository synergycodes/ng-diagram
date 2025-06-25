import type { FlowStateUpdate, Middleware } from '../../types';
import { snapNumber } from '../../utils';

const SNAP_GRID = 10;

export const nodePositionSnapMiddleware: Middleware = {
  name: 'node-position-snap',
  execute: (context, next, cancel) => {
    const { helpers, nodesMap, flowCore } = context;

    const shouldSnap = helpers.checkIfAnyNodePropsChanged(['position']);

    if (!shouldSnap) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    for (const nodeId of helpers.getAffectedNodeIds(['position'])) {
      const node = nodesMap.get(nodeId);

      if (!node) {
        continue;
      }

      const snappedX = snapNumber(node.position.x, SNAP_GRID);
      const snappedY = snapNumber(node.position.y, SNAP_GRID);

      const originalNode = flowCore.getNodeById(node.id);

      // Prevent unnecessary state updates if already snapped
      if (originalNode && (originalNode.position.x !== snappedX || originalNode.position.y !== snappedY)) {
        nodesToUpdate.push({
          id: node.id,
          position: { x: snappedX, y: snappedY },
        });
      }
    }

    if (nodesToUpdate.length === 0) {
      cancel();
      return;
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
