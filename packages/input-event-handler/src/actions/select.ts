import { ActionWithPredicate, PointerEvent } from '@angularflow/core';

export const selectAction: ActionWithPredicate = {
  action: (event, inputEventHandler) => {
    const pointerEvent = event as PointerEvent;

    if (!pointerEvent.target) {
      inputEventHandler.commandHandler.emit('deselectAll');
    } else {
      inputEventHandler.commandHandler.emit('select', { ids: [pointerEvent.target.id] });
    }
  },
  predicate: (event) => event.type === 'pointerdown',
};
