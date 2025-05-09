import { ActionWithPredicate, isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent } from '@angularflow/core';

// TODO: This implementation adds linking on right button click. When port is added, right click should be removed.

let isLinking = false;

export const linkingAction: ActionWithPredicate = {
  action: (event, flowCore) => {
    if (isPointerDownEvent(event)) {
      isLinking = true;
      if (event.target?.type === 'node') {
        flowCore.commandHandler.emit('startLinking', { source: event.target.element.id });
      } else {
        flowCore.commandHandler.emit('startLinkingFromPosition', {
          position: flowCore.clientToFlowPosition({ x: event.x, y: event.y }),
        });
      }
    }

    if (isPointerMoveEvent(event) && isLinking) {
      flowCore.commandHandler.emit('moveTemporaryEdge', {
        position: flowCore.clientToFlowPosition({ x: event.x, y: event.y }),
      });
    }

    if (isPointerUpEvent(event) && isLinking) {
      isLinking = false;
      if (event.target?.type === 'node') {
        flowCore.commandHandler.emit('finishLinking', {
          target: event.target.element.id,
        });
      } else {
        flowCore.commandHandler.emit('finishLinkingToPosition', {
          position: flowCore.clientToFlowPosition({ x: event.x, y: event.y }),
        });
      }
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 2) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 2),
};
