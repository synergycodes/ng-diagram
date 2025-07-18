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
    const { helpers, nodesMap, flowCore } = context;

    const snapConfig = context.middlewareMetadata.snap;

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

      const snappedX = snapNumber(node.position.x, snapConfig.x ?? 10);
      const snappedY = snapNumber(node.position.y, snapConfig.y ?? 10);

      const originalNode = flowCore.getNodeById(node.id);

      // Prevent unnecessary state updates if already snapped
      if (originalNode && (originalNode.position.x !== snappedX || originalNode.position.y !== snappedY)) {
        let size;

        const prevWidth = originalNode.size?.width ?? 0;
        const prevHeight = originalNode.size?.height ?? 0;

        const hasWidthChanged = prevWidth !== (node.size?.width ?? prevWidth);
        const hasHeightChanged = prevHeight !== (node.size?.height ?? prevHeight);

        const movedX = originalNode.position.x !== node.position.x;
        const movedY = originalNode.position.y !== node.position.y;

        const isLeftResized = movedX && hasWidthChanged;
        const isTopResized = movedY && hasHeightChanged;
        const isRightResized = !movedX && hasWidthChanged;
        const isBottomResized = !movedY && hasHeightChanged;

        if (isLeftResized || isTopResized || isRightResized || isBottomResized) {
          const originalRightBoundary = originalNode.position.x + prevWidth;
          const originalBottomBoundary = originalNode.position.y + prevHeight;

          let updatedWidth = node.size?.width ?? prevWidth;
          let updatedHeight = node.size?.height ?? prevHeight;

          if (isLeftResized) {
            updatedWidth = originalRightBoundary - snappedX;
          }

          if (isRightResized) {
            updatedWidth = snapNumber(updatedWidth, snapConfig.x ?? 0);
          }

          if (isTopResized) {
            updatedHeight = Math.max(originalBottomBoundary - snappedY, 0);
          }

          if (isBottomResized) {
            updatedHeight = snapNumber(updatedHeight, snapConfig.x ?? 0);
          }

          size = {
            width: Math.round(updatedWidth),
            height: Math.round(updatedHeight),
          };
        }

        nodesToUpdate.push({
          id: node.id,
          position: { x: snappedX, y: snappedY },
          ...(size ? { size } : {}),
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
