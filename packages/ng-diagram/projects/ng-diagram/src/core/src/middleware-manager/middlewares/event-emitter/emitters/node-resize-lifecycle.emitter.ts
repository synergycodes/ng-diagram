import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class NodeResizeStartedEmitter implements EventEmitter {
  name = 'NodeResizeStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('resizeNodeStart')) {
      return;
    }

    const resizingNode = context.actionStateManager.resize?.resizingNode;
    if (!resizingNode) {
      return;
    }

    const node = context.nodesMap.get(resizingNode.id);
    if (!node) {
      return;
    }

    eventManager.deferredEmit('nodeResizeStarted', { node });
  }
}

export class NodeResizeEndedEmitter implements EventEmitter {
  name = 'NodeResizeEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('resizeNodeStop')) {
      return;
    }

    const resize = context.actionStateManager.resize;
    const resizingNode = resize?.resizingNode;
    if (!resizingNode) {
      return;
    }

    const node = context.nodesMap.get(resizingNode.id);
    if (!node) {
      return;
    }

    eventManager.deferredEmit('nodeResizeEnded', {
      node,
      ...(resize.cancelReason && { cancelReason: resize.cancelReason }),
    });
  }
}
