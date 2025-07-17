import { __NEW__EventHandler } from '../event-hander';
import { __NEW__KeyboardPanningEvent } from './keyboard-panning.event';

export class KeyboardPanningEventHandler extends __NEW__EventHandler<__NEW__KeyboardPanningEvent> {
  handle(event: __NEW__KeyboardPanningEvent): void {
    let x = 0;
    let y = 0;

    switch (event.direction) {
      case 'top': {
        y = -10;
        break;
      }
      case 'bottom': {
        y = 10;
        break;
      }
      case 'left': {
        x = -10;
        break;
      }
      case 'right': {
        x = 10;
        break;
      }
      default:
        return; // Ignore other keys
    }
    this.flow.commandHandler.emit('moveViewportBy', { x, y });
  }
}
