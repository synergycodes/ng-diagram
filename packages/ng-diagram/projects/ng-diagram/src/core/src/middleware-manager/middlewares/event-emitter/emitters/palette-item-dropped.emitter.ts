import { PaletteItemDroppedEvent } from '../../../../event-manager';
import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class PaletteItemDroppedEmitter implements EventEmitter {
  name = 'PaletteItemDroppedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'paletteDropNode') {
      return;
    }
    // Get the newly added nodes
    const addedNode = context.initialUpdate.nodesToAdd?.[0];
    if (addedNode) {
      // For palette drops, typically only one node is added at a time
      const event: PaletteItemDroppedEvent = {
        node: addedNode,
        dropPosition: addedNode.position,
      };
      eventManager.deferredEmit('paletteItemDropped', event);
    }
  }
}
