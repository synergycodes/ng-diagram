import { snapAngle } from '../../input-events/handlers/rotate/snap-angle';
import type { FlowStateUpdate, Middleware } from '../../types';

export interface NodeRotationSnapMiddlewareMetadata {
  snap: number;
  enabled: boolean;
}

/**
 * @deprecated: We're moving snapping to the command handler.
 */
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

    const nodesToSnap: FlowStateUpdate['nodesToUpdate'] = [];
    const nodesToSkipSnapping: FlowStateUpdate['nodesToUpdate'] = [];

    for (const nodeId of helpers.getAffectedNodeIds(['angle'])) {
      const node = nodesMap.get(nodeId);

      if (!node || !node.angle) {
        continue;
      }

      if (!flowCore.config.nodeRotation.shouldSnapForNode(node)) {
        nodesToSkipSnapping.push({ id: node.id });
        continue;
      }

      const isSnapMeaningful = node.angle % snap !== 0;

      if (!isSnapMeaningful) {
        continue;
      }

      const snappedAngle = snapAngle(node.angle, flowCore.config.nodeRotation.computeSnapAngleForNode(node) || snap);

      const originalNode = flowCore.getNodeById(node.id);

      // This prevents unnecessary state updates when the angle is already snapped
      if (originalNode && originalNode.angle !== snappedAngle) {
        nodesToSnap.push({ id: node.id, angle: snappedAngle });
      }
    }

    if (nodesToSnap.length === 0 && nodesToSkipSnapping.length === 0) {
      cancel();
      return;
    }

    const allNodesToUpdate = [...nodesToSnap, ...nodesToSkipSnapping];

    next({
      ...(allNodesToUpdate.length > 0 ? { nodesToUpdate: allNodesToUpdate } : {}),
    });
  },
};
