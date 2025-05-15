import {
  isPointerDownEvent,
  isPointerMoveEvent,
  isPointerUpEvent,
  isPortTarget,
  type InputActionWithPredicate,
} from '../../types';

let isLinking = false;

export const linkingAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointerDownEvent(event) && isPortTarget(event.target)) {
      isLinking = true;
      flowCore.commandHandler.emit('startLinking', {
        source: event.target.element.nodeId,
        sourcePort: event.target.element.id,
      });
    }

    if (isPointerMoveEvent(event) && isLinking) {
      flowCore.commandHandler.emit('moveTemporaryEdge', {
        position: flowCore.clientToFlowPosition({ x: event.x, y: event.y }),
      });
    }

    if (isPointerUpEvent(event) && isLinking) {
      isLinking = false;
      if (isPortTarget(event.target)) {
        flowCore.commandHandler.emit('finishLinking', {
          target: event.target.element.nodeId,
          targetPort: event.target.element.id,
        });
      }
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 0 && isPortTarget(event.target)) ||
    (isPointerMoveEvent(event) && isLinking) ||
    (isPointerUpEvent(event) && event.button === 0 && isPortTarget(event.target)),
};
