import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';
import { getSelectedNodesWithChildren } from './utils/get-selected-nodes-with-children';

export class NodeDragStartedEmitter implements EventEmitter {
  name = 'NodeDragStartedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('moveNodesStart')) {
      return;
    }

    const nodes = getSelectedNodesWithChildren(context.nodesMap);

    if (nodes.length === 0) {
      return;
    }

    eventManager.deferredEmit('nodeDragStarted', { nodes });
  }
}
