import { ActionWithPredicate, isKeyboardDownEvent } from '@angularflow/core';

export const pasteAction: ActionWithPredicate = {
  action: (_event, handler) => handler.commandHandler.emit('paste'),
  predicate: (event, _handler, environment) => {
    if (!isKeyboardDownEvent(event)) {
      return false;
    }

    const modifierKey = environment.os === 'MacOS' ? event.metaKey : event.ctrlKey;
    return event.key === 'v' && modifierKey;
  },
};
