import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext, Node } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class NodeResizedEmitter implements EventEmitter {
  name = 'NodeResizedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'resizeNode') {
      return;
    }

    const resizedNode = context.initialUpdate.nodesToUpdate?.[0] as Node | undefined;

    if (resizedNode) {
      const initialNode = context.initialNodesMap.get(resizedNode.id);

      if (initialNode && initialNode.size) {
        const currentSize = resizedNode.size;
        const initialSize = initialNode.size;

        if (currentSize && initialSize) {
          const sizeChanged = currentSize.width !== initialSize.width || currentSize.height !== initialSize.height;

          if (sizeChanged) {
            eventManager.deferredEmit('nodeResized', {
              node: resizedNode,
              previousSize: { width: initialSize.width, height: initialSize.height },
            });
          }
        }
      }
    }
  }
}
