import { snapAngle } from '../../input-events/handlers/rotate/snap-angle';
import type { FlowStateUpdate, Middleware } from '../../types';

export interface NodeRotationSnapMiddlewareMetadata {
  snap: number;
  enabled: boolean;
}

export const nodeRotationSnapMiddleware: Middleware<'node-rotation-snap', NodeRotationSnapMiddlewareMetadata> = {
  name: 'node-rotation-snap',
  defaultMetadata: {
    snap: 15,
    enabled: true,
  },
  execute: (context, next, cancel) => {
    const { helpers, nodesMap, flowCore } = context;

    const { enabled, snap } = context.middlewareMetadata;

    if (!enabled) {
      next();
      return;
    }

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

      const shouldSnap = node.angle % snap !== 0;

      if (!shouldSnap) {
        continue;
      }

      const snappedAngle = snapAngle(node.angle, snap);

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
