import { ActionWithPredicate, isKeyboardEvent, isKeyboardPressEvent, isKeyboardUpEvent } from '@angularflow/core';

export const copyAction: ActionWithPredicate = {
  action: (event, handler) => {
    if (isKeyboardEvent(event)) {
      handler.commandHandler.emit('copy');
    }
  },
  predicate: (event, handler, environment) => {
    if (!isKeyboardPressEvent(event) || !isKeyboardUpEvent(event)) {
      return false;
    }
    const isMac = environment.os === 'macos';
    const isCopyKey = isMac ? handler.context.metaKey : handler.context.ctrlKey;
    return event.key === 'c' && isCopyKey;
  },
};
