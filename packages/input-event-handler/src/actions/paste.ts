import { ActionWithPredicate, isKeyboardEvent, isKeyboardPressEvent, isKeyboardUpEvent } from '@angularflow/core';

export const pasteAction: ActionWithPredicate = {
  action: (event, handler) => {
    if (isKeyboardEvent(event)) {
      handler.commandHandler.emit('paste');
    }
  },
  predicate: (event, handler, environment) => {
    if (!isKeyboardPressEvent(event) || !isKeyboardUpEvent(event)) {
      return false;
    }
    const isMac = environment.os === 'macos';
    const isPasteKey = isMac ? handler.context.metaKey : handler.context.ctrlKey;
    return event.key === 'v' && isPasteKey;
  },
};
