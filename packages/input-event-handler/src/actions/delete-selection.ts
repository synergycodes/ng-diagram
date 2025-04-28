import { ActionWithPredicate } from '@angularflow/core';

export const deleteSelectionAction: ActionWithPredicate = {
  action: (_, inputEventHandler) => {
    inputEventHandler.commandHandler.emit('deleteSelection');
  },
  predicate: (event) => event.type === 'keydown' && (event.key === 'Backspace' || event.key === 'Delete'),
};
