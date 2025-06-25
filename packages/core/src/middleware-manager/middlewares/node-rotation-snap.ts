import { snapAngle } from '../../input-event-handler/input-actions/rotate/snap-angle';
import type { FlowStateUpdate, Middleware } from '../../types';

const SNAP_ANGLE = 15;

export const nodeRotationSnapMiddleware: Middleware = {
  name: 'node-rotation-snap',
  execute: (context, next, cancel) => {
    const { helpers, nodesMap, flowCore } = context;

    const shouldSnap = helpers.checkIfAnyNodePropsChanged(['angle']);

    if (!shouldSnap) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    for (const nodeId of helpers.getAffectedNodeIds(['angle'])) {
      const node = nodesMap.get(nodeId);

      if (!node || !node.angle) {
        continue;
      }

      const shouldSnap = node.angle % SNAP_ANGLE !== 0;

      if (!shouldSnap) {
        continue;
      }

      const snappedAngle = snapAngle(node.angle, SNAP_ANGLE);

      const originalNode = flowCore.getNodeById(node.id);

      // This prevents unnecessary state updates when the angle is already snapped
      if (originalNode && originalNode.angle !== snappedAngle) {
        nodesToUpdate.push({ id: node.id, angle: snappedAngle });
      }
    }

    if (nodesToUpdate.length === 0) {
      cancel();
      return;
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
