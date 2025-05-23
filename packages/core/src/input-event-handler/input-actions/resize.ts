import { isNodeTarget, isResizeEvent, type InputActionWithPredicate } from '../../types';

export const resizeAction: InputActionWithPredicate = {
  action: (event, flowCore) => {
    if (event.target.type !== 'node' || !isResizeEvent(event)) {
      return;
    }

    const node = event.target.element;

    if (node.autoSize === false) {
      return;
    }

    const { width, height, disableAutoSize } = event;

    flowCore.commandHandler.emit('resizeNode', {
      id: node.id,
      size: {
        width,
        height,
      },
      disableAutoSize,
    });
  },
  predicate: (event) => isResizeEvent(event) && isNodeTarget(event.target),
};
