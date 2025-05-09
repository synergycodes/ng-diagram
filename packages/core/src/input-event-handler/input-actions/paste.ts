import { isKeyboardDownEvent, type InputActionWithPredicate } from '../../types';

export const pasteAction: InputActionWithPredicate = {
  action: (_, flowCore) => flowCore.commandHandler.emit('paste'),
  predicate: (event, flowCore) => {
    if (!isKeyboardDownEvent(event)) {
      return false;
    }

    const modifierKey = flowCore.environment.os === 'MacOS' ? event.metaKey : event.ctrlKey;
    return event.key === 'v' && modifierKey;
  },
};
