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
        const hasWidthChanged = originalNode.size?.width !== node?.size?.width;
        const isLeftResized = originalNode.position.x !== snappedX && hasWidthChanged;

        const hasHeightChanged = originalNode.size?.height !== node?.size?.height;
        const isTopResized = originalNode.position.y !== snappedY && hasHeightChanged;

        let size;

        if (isLeftResized || isTopResized) {
          const originalRightBoundary = originalNode.position.x + (originalNode.size?.width ?? 0);
          const originalBottomBoundary = originalNode.position.y + (originalNode.size?.height ?? 0);

          const updatedWidth = isLeftResized ? originalRightBoundary - snappedX : (originalNode.size?.width ?? 0);
          const updatedHeight = isTopResized ? originalBottomBoundary - snappedY : (originalNode.size?.height ?? 0);
          size = {
            width: updatedWidth,
            height: updatedHeight,
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
