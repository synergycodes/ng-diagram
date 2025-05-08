import { ActionWithPredicate, isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent } from '@angularflow/core';

// TODO: This implementation adds linking on right button click. When port is added, double click should be removed.

let isLinking = false;

export const linkingAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    if (isPointerDownEvent(event)) {
      isLinking = true;
      if (event.target?.type === 'node') {
        return inputEventHandler.commandHandler.emit('startLinking', { source: event.target.element.id });
      }
      inputEventHandler.commandHandler.emit('startLinkingFromPosition', {
        position: { x: event.x, y: event.y },
      });
    }

    if (isPointerMoveEvent(event) && isLinking) {
      inputEventHandler.commandHandler.emit('moveTemporaryEdge', {
        position: { x: event.x, y: event.y },
      });
    }

    if (isPointerUpEvent(event) && isLinking) {
      isLinking = false;
      if (event.target?.type === 'node') {
        return inputEventHandler.commandHandler.emit('finishLinking', {
          target: event.target.element.id,
        });
      }
      inputEventHandler.commandHandler.emit('finishLinkingToPosition', {
        position: { x: event.x, y: event.y },
      });
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 2) ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 2),
};
