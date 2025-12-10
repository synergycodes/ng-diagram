import { PaletteItemDroppedEvent } from '../../../../event-manager';
import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class PaletteItemDroppedEmitter implements EventEmitter {
  name = 'PaletteItemDroppedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (!context.modelActionTypes.includes('paletteDropNode')) {
      return;
    }

    const addedNodeRequest = context.initialUpdate.nodesToAdd?.[0];
    if (!addedNodeRequest) {
      return;
    }

    const nodeId = addedNodeRequest.id;
    const initialNode = context.initialNodesMap.get(nodeId);
    const currentNode = context.nodesMap.get(nodeId);

    if (!initialNode && currentNode) {
      const event: PaletteItemDroppedEvent = {
        node: currentNode,
        dropPosition: currentNode.position,
      };
      eventManager.deferredEmit('paletteItemDropped', event);
    }
  }
}
