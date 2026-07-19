import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class NodeResizeStartedEmitter implements EventEmitter {
  name = 'NodeResizeStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('resizeNodeStart')) {
      return;
    }

    // Prefer the pass's own capture over the (possibly newer-gesture) live
    // state — see FlowStateUpdate.gestureNodeIds.
    const nodeId = context.initialUpdate.gestureNodeIds?.[0] ?? context.actionStateManager.resize?.resizingNode.id;
    if (!nodeId) {
      return;
    }

    const node = context.nodesMap.get(nodeId);
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

    const nodeId = context.initialUpdate.gestureNodeIds?.[0] ?? context.actionStateManager.resize?.resizingNode.id;
    if (!nodeId) {
      return;
    }

    const node = context.nodesMap.get(nodeId);
    if (!node) {
      return;
    }

    eventManager.deferredEmit('nodeResizeEnded', { node });
  }
}
