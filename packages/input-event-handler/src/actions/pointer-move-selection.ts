import { ActionWithPredicate, Event, InputEventHandler, PointerEvent } from '@angularflow/core';

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
  action: (event: Event, inputEventHandler: InputEventHandler) => {
    const pointerEvent = event as PointerEvent;

    switch (pointerEvent.type) {
      case 'pointerdown':
        moveState.startX = pointerEvent.x;
        moveState.startY = pointerEvent.y;
        moveState.lastX = pointerEvent.x;
        moveState.lastY = pointerEvent.y;
        moveState.isMoving = true;
        moveState.isFirstMove = true;
        break;

      case 'pointermove':
        if (moveState.isMoving) {
          const dx = moveState.isFirstMove ? pointerEvent.x - moveState.startX : pointerEvent.x - moveState.lastX;
          const dy = moveState.isFirstMove ? pointerEvent.y - moveState.startY : pointerEvent.y - moveState.lastY;

          inputEventHandler.commandHandler.emit('moveSelection', { dx, dy });

          moveState.lastX = pointerEvent.x;
          moveState.lastY = pointerEvent.y;
          moveState.isFirstMove = false;
        }
        break;

      case 'pointerup':
        moveState.isMoving = false;
        break;
    }
  },
  predicate: (event: Event) =>
    event.type === 'pointerdown' || event.type === 'pointermove' || event.type === 'pointerup',
};
