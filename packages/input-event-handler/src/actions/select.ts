import { ActionWithPredicate, isPointerDownEvent } from '@angularflow/core';

export const selectAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    if (!isPointerDownEvent(event)) {
      return;
    }

    if (!event.target) {
      inputEventHandler.commandHandler.emit('deselectAll');
    } else {
      inputEventHandler.commandHandler.emit('select', { ids: [event.target.id] });
    }
  },
  predicate: (event) => isPointerDownEvent(event),
};
