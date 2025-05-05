import { ActionWithPredicate, isPointerDownEvent } from '@angularflow/core';

export const selectAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    if (event.target?.type === 'node' || event.target?.type === 'edge') {
      inputEventHandler.commandHandler.emit('select', { ids: [event.target.element.id] });
    } else {
      inputEventHandler.commandHandler.emit('deselectAll');
    }
  },
  predicate: (event) => isPointerDownEvent(event),
};
