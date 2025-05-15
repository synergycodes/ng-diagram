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
      case 'pointerdown':
        moveState.lastX = flowCore.clientToFlowPosition(event).x;
        moveState.lastY = flowCore.clientToFlowPosition(event).y;
        moveState.isMoving = true;
        break;

      case 'pointermove':
        if (moveState.isMoving) {
          const { x, y } = flowCore.clientToFlowPosition(event);
          const dx = x - moveState.lastX;
          const dy = y - moveState.lastY;

          flowCore.commandHandler.emit('moveSelection', { dx, dy });

          moveState.lastX = x;
          moveState.lastY = y;
        }
        break;

      case 'pointerup':
        moveState.isMoving = false;
        break;
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 0 && event.target?.type === 'node') ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 0),
};
