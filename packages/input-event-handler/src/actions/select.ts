import { ActionWithPredicate } from '@angularflow/core';

export const selectAction: ActionWithPredicate = {
  action: ({ target }, inputEventHandler) => {
    if (!target) {
      inputEventHandler.commandHandler.emit('deselectAll');
    } else {
      inputEventHandler.commandHandler.emit('select', { ids: [target.id] });
    }
  },
  predicate: (event) => event.type === 'pointerdown',
};
