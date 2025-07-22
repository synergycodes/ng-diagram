import type { FlowStateUpdate, Middleware } from '../../types';
import { snapNumber } from '../../utils';

export interface NodePositionSnapMiddlewareMetadata {
  snap: {
    x: number;
    y: number;
  };
}

export const nodePositionSnapMiddleware: Middleware<'node-position-snap', NodePositionSnapMiddlewareMetadata> = {
  name: 'node-position-snap',
  defaultMetadata: {
    snap: {
      x: 10,
      y: 10,
    },
  },
  execute: (context, next, cancel) => {
    const { helpers, nodesMap, flowCore, modelActionType } = context;

    const snapConfig = context.middlewareMetadata.snap;

    const shouldSnap = helpers.checkIfAnyNodePropsChanged(['position']);
    const sizeChanged = modelActionType === 'moveNodes' && helpers.checkIfAnyNodePropsChanged(['size']);
    const isCurrentlyResizing =
      modelActionType === 'resizeNode' && helpers.checkIfAnyNodePropsChanged(['size', 'position']);
    if (!shouldSnap && !isCurrentlyResizing && !sizeChanged) {
      next();
      return;
    }

    const nodesToUpdate: FlowStateUpdate['nodesToUpdate'] = [];

    // Handles snapping when resizing nodes or groups.
    if (isCurrentlyResizing || sizeChanged) {
      for (const nodeId of new Set(helpers.getAffectedNodeIds(['size', 'position']))) {
        const node = nodesMap.get(nodeId);
        const originalNode = flowCore.getNodeById(nodeId);
        if (!node || !originalNode) continue;

        const snappedX = snapNumber(node.position.x, snapConfig.x ?? 10);
        const snappedY = snapNumber(node.position.y, snapConfig.y ?? 10);

        const prevWidth = originalNode.size?.width ?? 0;
        const prevHeight = originalNode.size?.height ?? 0;
        const nodeWidth = node.size?.width ?? prevWidth;
        const nodeHeight = node.size?.height ?? prevHeight;
        const movedX = originalNode.position.x !== node.position.x;
        const movedY = originalNode.position.y !== node.position.y;

        let width = nodeWidth;
        let height = nodeHeight;

        if (prevWidth !== nodeWidth) {
          if (movedX) {
            width = Math.round(originalNode.position.x + prevWidth) - snappedX;
          } else {
            width = snapNumber(Math.round(snapNumber(nodeWidth, snapConfig.x ?? 10)), snapConfig.x ?? 0);
          }
        }

        if (prevHeight !== nodeHeight) {
          if (movedY) {
            height = Math.max(Math.round(originalNode.position.y + prevHeight) - snappedY, 0);
          } else {
            height = snapNumber(Math.round(snapNumber(nodeHeight, snapConfig.y ?? 10)), snapConfig.x ?? 0);
          }
        }

        nodesToUpdate.push({
          id: node.id,
          position: { x: snappedX, y: snappedY },
          size: { width, height },
        });
      }
    } else
      for (const nodeId of helpers.getAffectedNodeIds(['position'])) {
        const node = nodesMap.get(nodeId);

        if (!node) {
          continue;
        }
        const snappedX = snapNumber(node.position.x, snapConfig.x ?? 10);
        const snappedY = snapNumber(node.position.y, snapConfig.y ?? 10);
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
