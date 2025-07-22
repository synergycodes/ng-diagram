import { EventHandler } from '../event-hander';
import { ZoomingEvent } from './zooming.event';

export class ZoomingEventHandler extends EventHandler<ZoomingEvent> {
  handle(event: ZoomingEvent): void {
    const {
      updatedViewport: { x, y },
      updateScale,
    } = event;

    this.flow.commandHandler.emit('zoom', { x, y, scale: updateScale });
  }
}
