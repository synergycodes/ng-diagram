import {
  isPointerDownEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  Node,
  type InputActionWithPredicate,
} from '../../types';

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
        const selectedNodes = flowCore.modelLookup.getSelectedNodes();
        const nodes = flowCore.model.getNodes();

        const updateData: { id: string; groupId?: string; zOrder?: number }[] = [];

        for (const selectedNode of selectedNodes) {
          // Find if there's a group node under the center of this node
          const nodeCenter = {
            x: selectedNode.position.x + (selectedNode.size?.width || 0) / 2,
            y: selectedNode.position.y + (selectedNode.size?.height || 0) / 2,
          };

          // Get all nodes at this position
          const groupsAtPosition = flowCore
            .getNodesInRange(nodeCenter, 1)
            .filter((node) => node.isGroup || !node.selected);

          const topLevelGroupNode = groupsAtPosition.sort((a, b) => (b.zOrder ?? 0) - (a.zOrder ?? 0))[0];

          if (topLevelGroupNode) {
            // Check for circular dependency
            if (!wouldCreateCircularDependency(nodes, selectedNode.id, topLevelGroupNode.id)) {
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
        break;
      }
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 0 && event.target?.type === 'node') ||
    (isPointerMoveEvent(event) && moveState.isMoving) ||
    (isPointerUpEvent(event) && event.button === 0),
};

// Helper function to check for circular dependencies
function wouldCreateCircularDependency(nodes: Node[], nodeId: string, targetParentId: string): boolean {
  // If trying to make a node its own parent
  if (nodeId === targetParentId) {
    return true;
  }

  // Check if targetParentId is a descendant of nodeId
  const checkDescendants = (currentId: string): boolean => {
    const children = nodes.filter((n) => n.groupId === currentId);
    for (const child of children) {
      if (child.id === targetParentId) {
        return true;
      }
      if (checkDescendants(child.id)) {
        return true;
      }
    }
    return false;
  };

  return checkDescendants(nodeId);
}
