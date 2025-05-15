import { isResizeEvent, type InputActionWithPredicate } from '../../types';

export const resizeAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (event.target.type !== 'node' || !isResizeEvent(event)) {
      return;
    }

    const node = event.target.element;
    if (node.sizeControlled) {
      return;
    }

    const { width: newWidth, height: newHeight } = event;

    flowCore.commandHandler.emit('resizeNode', {
      id: node.id,
      size: {
        width: newWidth,
        height: newHeight,
      },
    });
  },
  predicate: (event) => isResizeEvent(event) && event.target.type === 'node',
};
