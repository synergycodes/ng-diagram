import { type InputActionWithPredicate } from '../../types';
import { keyCombo } from './input-actions.helpers';

export const copyAction: InputActionWithPredicate = {
  action: (_event, flowCore) => flowCore.commandHandler.emit('copy'),
  predicate: keyCombo('c', 'primary'),
};
