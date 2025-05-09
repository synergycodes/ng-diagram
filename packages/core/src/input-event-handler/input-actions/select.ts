import { isPointerDownEvent, type InputActionWithPredicate } from '../../types';

export const selectAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    console.log(event);
    if (event.target?.type === 'node' || event.target?.type === 'edge') {
      flowCore.commandHandler.emit('select', { ids: [event.target.element.id] });
    } else {
      flowCore.commandHandler.emit('deselectAll');
    }
  },
  predicate: (event) => isPointerDownEvent(event),
};
