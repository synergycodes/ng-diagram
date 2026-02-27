import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class NodeRotateStartedEmitter implements EventEmitter {
  name = 'NodeRotateStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('rotateNodeStart')) {
      return;
    }

    const nodeId = context.actionStateManager.rotation?.nodeId;
    if (!nodeId) {
      return;
    }

    const node = context.nodesMap.get(nodeId);
    if (!node) {
      return;
    }

    eventManager.deferredEmit('nodeRotateStarted', { node });
  }
}

export class NodeRotateEndedEmitter implements EventEmitter {
  name = 'NodeRotateEndedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('rotateNodeStop')) {
      return;
    }

    const nodeId = context.actionStateManager.rotation?.nodeId;
    if (!nodeId) {
      return;
    }

    const node = context.nodesMap.get(nodeId);
    if (!node) {
      return;
    }

    eventManager.deferredEmit('nodeRotateEnded', { node });
  }
}
