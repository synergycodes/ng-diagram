import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class NodeResizedEmitter implements EventEmitter {
  name = 'NodeResizedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'resizeNode') {
      return;
    }

    const resizedNodeUpdate = context.initialUpdate.nodesToUpdate?.[0];

    if (!resizedNodeUpdate) {
      return;
    }

    const nodeId = resizedNodeUpdate.id;
    const initialNode = context.initialNodesMap.get(nodeId);
    const currentNode = context.nodesMap.get(nodeId);

    if (!initialNode || !currentNode) {
      return;
    }

    const initialSize = initialNode.size;
    const currentSize = currentNode.size;

    if (initialSize && currentSize) {
      const sizeChanged = currentSize.width !== initialSize.width || currentSize.height !== initialSize.height;

      if (sizeChanged) {
        eventManager.deferredEmit('nodeResized', {
          node: currentNode,
          previousSize: { width: initialSize.width, height: initialSize.height },
        });
      }
    }
  }
}
