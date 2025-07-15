import { type InputActionWithPredicate } from '../../types';
import { isDeleteKey } from '../../types/__old__event/event.guards';

export const deleteSelectionAction: InputActionWithPredicate = {
  action: (_, flowCore) => flowCore.commandHandler.emit('deleteSelection'),
  predicate: isDeleteKey,
};
