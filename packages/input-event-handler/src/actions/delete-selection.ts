import { ActionWithPredicate, isKeyboardDownEvent } from '@angularflow/core';

export const deleteSelectionAction: ActionWithPredicate = {
  action: (_, inputEventHandler) => {
    inputEventHandler.commandHandler.emit('deleteSelection');
  },
  predicate: (event) => isKeyboardDownEvent(event) && (event.key === 'Backspace' || event.key === 'Delete'),
};
