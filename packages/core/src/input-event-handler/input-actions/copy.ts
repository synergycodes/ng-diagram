import { isKeyboardDownEvent, type InputActionWithPredicate } from '../../types';

export const copyAction: InputActionWithPredicate = {
  action: (_event, flowCore) => flowCore.commandHandler.emit('copy'),
  predicate: (event, flowCore) => {
    if (!isKeyboardDownEvent(event)) {
      return false;
    }

    const modifierKey = flowCore.environment.os === 'MacOS' ? event.metaKey : event.ctrlKey;
    return event.key === 'c' && modifierKey;
  },
};
