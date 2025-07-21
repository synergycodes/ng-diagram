import { __NEW__EventHandler } from '../event-hander';
import { __NEW__ZoomingEvent } from './zooming.event';

export class ZoomingEventHandler extends __NEW__EventHandler<__NEW__ZoomingEvent> {
  handle(event: __NEW__ZoomingEvent): void {
    const {
      updatedViewport: { x, y },
      updateScale,
    } = event;

    this.flow.commandHandler.emit('zoom', { x, y, scale: updateScale });
  }
}
