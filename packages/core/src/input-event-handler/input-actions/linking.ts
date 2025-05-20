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
    if (isPointerDownEvent(event) && isPortTarget(event.target) && event.target.element.type !== 'target') {
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
      if (isPortTarget(event.target) && event.target.element.type !== 'source') {
        flowCore.commandHandler.emit('finishLinking', {
          target: event.target.element.nodeId,
          targetPort: event.target.element.id,
        });
      } else {
        flowCore.commandHandler.emit('finishLinking', {});
      }
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) &&
      event.button === 0 &&
      isPortTarget(event.target) &&
      event.target.element.type !== 'target') ||
    (isPointerMoveEvent(event) && isLinking) ||
    (isPointerUpEvent(event) && event.button === 0),
};
