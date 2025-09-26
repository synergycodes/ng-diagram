import { EventHandler } from '../event-handler';
import { KeyboardPanningEvent } from './keyboard-panning.event';

export class KeyboardPanningEventHandler extends EventHandler<KeyboardPanningEvent> {
  handle(event: KeyboardPanningEvent): void {
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
