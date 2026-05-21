import { EventHandler } from '../event-handler';
import { WheelPanningEvent } from './wheel-panning.event';

export class WheelPanningEventHandler extends EventHandler<WheelPanningEvent> {
  handle(event: WheelPanningEvent): void {
    const { deltaX, deltaY } = event;

    if (deltaX === 0 && deltaY === 0) {
      return;
    }

    this.flow.commandHandler.emit('moveViewportBy', { x: -deltaX, y: -deltaY });
  }
}
