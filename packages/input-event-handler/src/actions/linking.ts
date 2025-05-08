import { ActionWithPredicate, isPointerDownEvent, isPointerMoveEvent, isPointerUpEvent } from '@angularflow/core';

// TODO: This implementation adds linking on right button click. When port is added, double click should be removed.

let isLinking = false;

export const linkingAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    if (isPointerDownEvent(event) && event.target?.type === 'node') {
      isLinking = true;
      inputEventHandler.commandHandler.emit('startLinking', { source: event.target.element.id });
    } else if (isPointerMoveEvent(event) && isLinking) {
      inputEventHandler.commandHandler.emit('moveTemporaryEdge', {
        position: { x: event.x, y: event.y },
      });
    } else if (isPointerUpEvent(event) && isLinking) {
      isLinking = false;
      inputEventHandler.commandHandler.emit('finishLinking', {
        target: event.target?.type === 'node' ? event.target.element.id : undefined,
      });
    }
  },
  predicate: (event) =>
    (isPointerDownEvent(event) && event.button === 2 && event.target?.type === 'node') ||
    isPointerMoveEvent(event) ||
    (isPointerUpEvent(event) && event.button === 2),
};
