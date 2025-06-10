import { snapAngle } from '../../input-event-handler/input-actions/rotate/snap-angle';
import type { FlowStateUpdate, Middleware } from '../../types';

const SNAP_ANGLE = 15;

export const nodeRotationSnapMiddleware: Middleware = {
  name: 'node-rotation-snap',
  execute: (context, next) => {
    const {
      state: { nodes },
      helpers,
    } = context;

    const shouldSnap = helpers.checkIfAnyNodePropsChanged(['angle']);

    if (!shouldSnap) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    for (const node of nodes) {
      if (!node.angle) {
        continue;
      }

      const shouldSnap = node.angle % SNAP_ANGLE !== 0;

      if (!shouldSnap) {
        continue;
      }

      const snappedAngle = snapAngle(node.angle, SNAP_ANGLE);

      nodesToUpdate.push({ id: node.id, angle: snappedAngle });
    }

    next({ ...(nodesToUpdate.length > 0 ? { nodesToUpdate } : {}) });
  },
};
