import { type InputActionWithPredicate } from '../../types';
import { keyCombo } from './input-actions.helpers';

export const pasteAction: InputActionWithPredicate = {
  action: (_, flowCore) => flowCore.commandHandler.emit('paste'),
  predicate: keyCombo('v', 'primary'),
};
