import type { EventManager } from '../../../../event-manager/event-manager';
import type { ViewportChangedEvent } from '../../../../event-manager/event-types';
import type { MiddlewareContext } from '../../../../types';
import type { EventEmitter } from './event-emitter.interface';

export class ViewportChangedEmitter implements EventEmitter {
  name = 'ViewportChangedEmitter';

  emit({ initialState, state }: MiddlewareContext, eventManager: EventManager): void {
    const prevViewport = initialState.metadata.viewport;
    const currViewport = state.metadata.viewport;

    const hasChanged =
      prevViewport.x !== currViewport.x ||
      prevViewport.y !== currViewport.y ||
      prevViewport.scale !== currViewport.scale;

    if (hasChanged) {
      const event: ViewportChangedEvent = {
        viewport: currViewport,
        previousViewport: prevViewport,
      };
      eventManager.emit('viewportChanged', event);
    }
  }
}
