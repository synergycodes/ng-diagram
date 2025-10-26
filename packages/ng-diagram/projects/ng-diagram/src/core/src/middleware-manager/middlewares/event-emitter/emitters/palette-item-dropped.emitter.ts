import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class PaletteItemDroppedEmitter implements EventEmitter {
  name = 'PaletteItemDroppedEmitter';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emit(context: MiddlewareContext, eventManager: EventManager): void {
    // console.log('PaletteItemDroppedEmitter emit called', context, eventManager);
    return;
    // CHECK SOMEHOW IF A PALETTE ITEM WAS DROPPED
    // if (context.modelActionType !== 'addNodes/fromPalette') {
    //   return;
    // }
    // // Get the newly added nodes
    // const addedNode = context.initialUpdate.nodesToAdd[0];
    // if (addedNode) {
    //   // For palette drops, typically only one node is added at a time
    //   const addedNode = addedNodes[0];
    //   const event: PaletteItemDroppedEvent = {
    //     node: addedNode,
    //     paletteItem: paletteDropState.paletteItem,
    //     dropPosition: paletteDropState.dropPosition,
    //   };
    //   eventManager.deferredEmit('paletteItemDropped', event);
    // }
  }
}
