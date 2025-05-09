import { ActionWithPredicate, isPointerDownEvent } from '@angularflow/core';

export const selectAction: ActionWithPredicate = {
  action: (event, flowCore) => {
    if (event.target?.type === 'node' || event.target?.type === 'edge') {
      flowCore.commandHandler.emit('select', { ids: [event.target.element.id] });
    } else {
      flowCore.commandHandler.emit('deselectAll');
    }
  },
  predicate: (event) => isPointerDownEvent(event),
};
