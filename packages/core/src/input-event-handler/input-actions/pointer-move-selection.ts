import { FlowCore } from '../../flow-core';
import { isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent, type InputActionWithPredicate } from '../../types';

interface MoveState {
  lastX: number;
  lastY: number;
  isMoving: boolean;
}

const moveState: MoveState = {
  lastX: 0,
  lastY: 0,
  isMoving: false,
};

export const pointerMoveSelectionAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    switch (event.type) {
      case 'pointerdown': {
        const { x, y } = flowCore.clientToFlowPosition(event);

        moveState.lastX = x;
        moveState.lastY = y;
        moveState.isMoving = true;
        break;
      }

      case 'pointermove': {
        if (!moveState.isMoving) return;

        const { x, y } = flowCore.clientToFlowPosition(event);
        const dx = x - moveState.lastX;
        const dy = y - moveState.lastY;

        flowCore.commandHandler.emit('moveSelection', { dx, dy });

        moveState.lastX = x;
        moveState.lastY = y;

        break;
      }

      case 'pointerup': {
        if (!moveState.isMoving) return;

        const selectedNodes = flowCore.modelLookup.getSelectedNodes();

        // Get all nodes at this position
        const groupsAtPointer = flowCore
          .getNodesInRange(
            {
              x: moveState.lastX,
              y: moveState.lastY,
            },
            1
          )
          .filter((node) => node.isGroup || !node.selected);

        const topLevelGroupNode = groupsAtPointer.sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0))[0];

        const updateData: { id: string; groupId?: string; zOrder?: number }[] = [];

        for (const selectedNode of selectedNodes) {
          if (topLevelGroupNode) {
            if (!wouldCreateCircularDependency(flowCore, selectedNode.id, topLevelGroupNode.id)) {
              updateData.push({
                id: selectedNode.id,
                groupId: topLevelGroupNode.id,
                zOrder: ((topLevelGroupNode.zOrder || selectedNode.zOrder) ?? 0) + 1,
              });
            }
            /**
             * If there is no group but node has a parent
             * thats means the node has been unassigned from the group
             */
          } else if (selectedNode.groupId) {
            updateData.push({
              id: selectedNode.id,
              groupId: undefined,
            });
          }
        }

        if (updateData.length > 0) {
          flowCore.commandHandler.emit('updateNodes', { nodes: updateData });
        }

        moveState.isMoving = false;
        moveState.lastX = 0;
        moveState.lastY = 0;
        break;
      }
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 0 && event.target?.type === 'node') ||
    (isPointerMoveEvent(event) && moveState.isMoving) ||
    (isPointerUpEvent(event) && event.button === 0),
};

const wouldCreateCircularDependency = (flowCore: FlowCore, nodeId: string, targetParentId: string): boolean => {
  // If trying to make a node its own parent
  if (nodeId === targetParentId) {
    return true;
  }

  // Check if targetParentId is a descendant of nodeId
  return flowCore.modelLookup.isNodeDescendantOfGroup(targetParentId, nodeId);
};
