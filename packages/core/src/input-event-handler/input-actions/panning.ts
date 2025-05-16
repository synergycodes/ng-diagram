import { isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent, type InputActionWithPredicate } from '../../types';

interface MoveState {
  lastX: number;
  lastY: number;
  isPanning: boolean;
}

const moveState: MoveState = {
  lastX: 0,
  lastY: 0,
  isPanning: false,
};

const pointerIds = new Set<number>();

export const panningAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    switch (event.type) {
      case 'pointerdown':
        pointerIds.add(event.pointerId);
        moveState.lastX = event.x;
        moveState.lastY = event.y;
        moveState.isPanning = true;
        break;
      case 'pointermove':
        if (moveState.isPanning && pointerIds.size === 1) {
          const x = event.x - moveState.lastX;
          const y = event.y - moveState.lastY;

          flowCore.commandHandler.emit('moveViewportBy', { x, y });

          moveState.lastX = event.x;
          moveState.lastY = event.y;
        }
        break;
      case 'pointerup':
        pointerIds.delete(event.pointerId);
        moveState.isPanning = false;
        break;
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.target?.type === 'diagram' && event.button === 0) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 0),
};
