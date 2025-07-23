import { EventHandler } from '../event-hander';
import { PasteEvent } from './paste.event';

export class PasteEventHandler extends EventHandler<PasteEvent> {
  handle(event: PasteEvent): void {
    console.log('Handling paste event:', event);
    this.flow.commandHandler.emit('paste');
  }
}
