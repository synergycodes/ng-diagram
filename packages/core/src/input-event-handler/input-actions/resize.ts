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

    const { width, height } = event;

    if (!node.size) {
      flowCore.initializationGuard.initNodeSize(node.id, { width, height });
    } else {
      flowCore.commandHandler.emit('resizeNode', {
        id: node.id,
        size: {
          width,
          height,
        },
      });
    }
  },
  predicate: (event) => isResizeEvent(event) && isNodeTarget(event.target),
};
