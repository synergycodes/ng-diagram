import { type InputActionWithPredicate } from '../../types';
import { onDiagram } from '../../types/__old__event/event-target.guards';
import { isContinue, isEnd, isPointer, isStart, withPrimaryButton } from '../../types/__old__event/event.guards';
import { and, or, targetIs } from './input-actions.helpers';

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
    if (!isPointer(event)) return;

    switch (event.phase) {
      case 'start':
        pointerIds.add(event.pointerId);
        moveState.lastX = event.position.x;
        moveState.lastY = event.position.y;
        moveState.isPanning = true;
        break;
      case 'continue':
        if (moveState.isPanning && pointerIds.size === 1) {
          const x = event.position.x - moveState.lastX;
          const y = event.position.y - moveState.lastY;

          flowCore.commandHandler.emit('moveViewportBy', { x, y });

          moveState.lastX = event.position.x;
          moveState.lastY = event.position.y;
        }
        break;
      case 'end':
        pointerIds.delete(event.pointerId);
        moveState.isPanning = false;
        break;
    }
  },
  predicate: and(
    isPointer,
    or(and(isStart, targetIs(onDiagram), withPrimaryButton), isContinue, and(isEnd, withPrimaryButton))
  ),
};
