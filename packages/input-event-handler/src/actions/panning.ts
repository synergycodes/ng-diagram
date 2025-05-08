import { ActionWithPredicate, isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent } from '@angularflow/core';

interface MoveState {
  startX: number;
  startY: number;
  lastX: number;
  lastY: number;
  isPanning: boolean;
  isFirstMove: boolean;
}

const moveState: MoveState = {
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  isPanning: false,
  isFirstMove: true,
};

export const panningAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    switch (event.type) {
      case 'pointerdown':
        moveState.startX = event.x;
        moveState.startY = event.y;
        moveState.lastX = event.x;
        moveState.lastY = event.y;
        moveState.isPanning = true;
        moveState.isFirstMove = true;
        break;

      case 'pointermove':
        if (moveState.isPanning) {
          const x = moveState.isFirstMove ? event.x - moveState.startX : event.x - moveState.lastX;
          const y = moveState.isFirstMove ? event.y - moveState.startY : event.y - moveState.lastY;

          inputEventHandler.commandHandler.emit('moveViewportBy', { x, y });

          moveState.lastX = event.x;
          moveState.lastY = event.y;
          moveState.isFirstMove = false;
        }
        break;

      case 'pointerup':
        moveState.isPanning = false;
        break;
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.target?.type === 'diagram' && event.button === 0) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 0),
};
