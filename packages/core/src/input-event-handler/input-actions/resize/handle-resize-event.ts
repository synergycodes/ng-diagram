import { FlowCore } from '../../../flow-core';
import { isNodeTarget, ResizeEvent } from '../../../types';

export function handleResizeEvent(flowCore: FlowCore, event: ResizeEvent) {
  if (isNodeTarget(event.target)) {
    const node = event.target.element;
    if (node.autoSize === false) {
      return;
    }

    const { width, height } = event;
    flowCore.commandHandler.emit('resizeNode', {
      id: node.id,
      size: { width, height },
    });
  }
}
