import { FlowCore } from '../../flow-core';
import {
  isPointerDownEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  Node,
  Point,
  type InputActionWithPredicate,
} from '../../types';

interface MoveState {
  lastX: number;
  lastY: number;
  startX: number;
  startY: number;
  isMoving: boolean;
  initialNodePosition?: { x: number; y: number };
}

const moveState: MoveState = {
  lastX: 0,
  lastY: 0,
  startX: 0,
  startY: 0,
  isMoving: false,
};

const getTopGroupAtPoint = (flowCore: FlowCore, point: Point): Node | null => {
  // Get all nodes at this position
  const nodes = flowCore.getNodesInRange(point, 1);

  // Get all groups at this position that are not selected
  const groups = nodes.filter((node) => node.isGroup && !node.selected);

  // Get the top group
  return groups.toSorted((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0))[0];
};

export const pointerMoveSelectionAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    switch (event.type) {
      case 'pointerdown': {
        const { x, y } = flowCore.clientToFlowPosition(event);

        moveState.lastX = x;
        moveState.lastY = y;
        moveState.startX = x;
        moveState.startY = y;
        moveState.isMoving = true;
        break;
      }

      case 'pointermove': {
        if (!moveState.isMoving) return;

        const { x, y } = flowCore.clientToFlowPosition(event);

        const dx = x - moveState.lastX;
        const dy = y - moveState.lastY;

        flowCore.commandHandler.emit('moveSelection', { dx, dy });

        const topLevelGroupNode = getTopGroupAtPoint(flowCore, {
          x: moveState.lastX,
          y: moveState.lastY,
        });

        if (topLevelGroupNode) {
          flowCore.commandHandler.emit('highlightGroup', { groupId: topLevelGroupNode.id });
        } else {
          flowCore.commandHandler.emit('highlightGroupClear');
        }

        moveState.lastX = x;
        moveState.lastY = y;

        break;
      }

      case 'pointerup': {
        if (!moveState.isMoving) return;

        const updateData: { id: string; groupId?: string; zOrder?: number }[] = [];
        const selectedNodes = flowCore.modelLookup.getSelectedNodesWithChildren({ directOnly: false });

        if (selectedNodes.length === 0) return;

        const firstNode = selectedNodes[0];

        /**
         * Store initial position of the first selected node
         * This is used to calculate the node movement delta which acts as source of truth
         *
         * Calculating the pointer delta is enough for movement purposes without snapping
         *
         * Due to rounding the position property in the node
         * the pointer delta and the node position delta are not the same
         *
         * This is why we need to store the initial node position
         * and use it to calculate the node movement delta and compare it
         * with the pointer delta to prevent out of sync unexpected behavior
         */
        if (!moveState.initialNodePosition) {
          moveState.initialNodePosition = { ...firstNode.position };
        }

        const { x, y } = flowCore.clientToFlowPosition(event);

        const deltaX = x - moveState.startX;
        const deltaY = y - moveState.startY;

        const dx = deltaX - (firstNode.position.x - moveState.initialNodePosition.x);
        const dy = deltaY - (firstNode.position.y - moveState.initialNodePosition.y);

        flowCore.commandHandler.emit('moveNodes', { dx, dy, nodes: selectedNodes });

        const topLevelGroupNode = getTopGroupAtPoint(flowCore, {
          x,
          y,
        });

        for (const selectedNode of flowCore.modelLookup.getSelectedNodes()) {
          if (topLevelGroupNode) {
            if (!flowCore.modelLookup.wouldCreateCircularDependency(selectedNode.id, topLevelGroupNode.id)) {
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

          if (updateData.length > 0) {
            flowCore.commandHandler.emit('updateNodes', { nodes: updateData });
          }

          // That means a group has been highlighted, so we need to clear it
          if (updateData.some((node) => Boolean(node.groupId))) {
            // TODO: Add batching updates - due to race condition this is not applied correctly
            // the initial state for the update is not updated
            setTimeout(() => {
              flowCore.commandHandler.emit('groupHighlightClear');
            }, 0);
          }

          moveState.isMoving = false;
          moveState.lastX = 0;
          moveState.lastY = 0;
          moveState.startX = 0;
          moveState.startY = 0;
          moveState.initialNodePosition = undefined;
          break;
        }

        if (updateData.length > 0) {
          flowCore.commandHandler.emit('updateNodes', { nodes: updateData });
        }

        // That means a group has been highlighted, so we need to clear it
        if (updateData.some((node) => Boolean(node.groupId))) {
          // TODO: Add batching updates - due to race condition this is not applied correctly
          // the initial state for the update is not yetupdated
          setTimeout(() => {
            flowCore.commandHandler.emit('highlightGroupClear');
          }, 0);
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
