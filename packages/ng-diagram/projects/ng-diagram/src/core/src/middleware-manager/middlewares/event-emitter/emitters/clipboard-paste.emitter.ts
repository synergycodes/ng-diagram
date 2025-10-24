import type { EventManager } from '../../../../event-manager/event-manager';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class ClipboardPastedEmitter implements EventEmitter {
  name = 'ClipboardPastedEmitter';

  emit(context: MiddlewareContext, eventManager: EventManager): void {
    if (context.modelActionType !== 'paste') {
      return;
    }

    eventManager.deferredEmit('clipboardPasted', {
      nodes: context.actionStateManager.getState().copyPaste?.copiedNodes || [],
      edges: context.actionStateManager.getState().copyPaste?.copiedEdges || [],
    });
  }
}
