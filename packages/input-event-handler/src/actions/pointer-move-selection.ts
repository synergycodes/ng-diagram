import {
  ActionWithPredicate,
  isPointerDownEvent,
  isPointerEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
} from '@angularflow/core';

interface MoveState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isMoving: boolean;
  isFirstMove: boolean;
}

const moveState: MoveState = {
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  isMoving: false,
  isFirstMove: true,
};

export const pointerMoveSelectionAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    if (!isPointerEvent(event)) {
      return;
    }

    switch (event.type) {
      case 'pointerdown':
        moveState.startX = event.x;
        moveState.startY = event.y;
        moveState.lastX = event.x;
        moveState.lastY = event.y;
        moveState.isMoving = true;
        moveState.isFirstMove = true;
        break;

      case 'pointermove':
        if (moveState.isMoving) {
          const dx = moveState.isFirstMove ? event.x - moveState.startX : event.x - moveState.lastX;
          const dy = moveState.isFirstMove ? event.y - moveState.startY : event.y - moveState.lastY;

          inputEventHandler.commandHandler.emit('moveSelection', { dx, dy });

          moveState.lastX = event.x;
          moveState.lastY = event.y;
          moveState.isFirstMove = false;
        }
        break;

      case 'pointerup':
        moveState.isMoving = false;
        break;
    }
  },
  predicate: (event) => isPointerDownEvent(event) || isPointerMoveEvent(event) || isPointerUpEvent(event),
};
