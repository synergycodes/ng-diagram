import { type InputActionWithPredicate } from '../../types';
import { isDeleteKey } from '../../types/event/event.guards';

export const deleteSelectionAction: InputActionWithPredicate = {
  action: (_, flowCore) => flowCore.commandHandler.emit('deleteSelection'),
  predicate: isDeleteKey,
};
