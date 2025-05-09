import { isKeyboardDownEvent, type InputActionWithPredicate } from '../../types';

export const deleteSelectionAction: InputActionWithPredicate = {
  action: (_, flowCore) => flowCore.commandHandler.emit('deleteSelection'),
  predicate: (event) => isKeyboardDownEvent(event) && (event.key === 'Backspace' || event.key === 'Delete'),
};
