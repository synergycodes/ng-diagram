import { EventHandler } from '../event-hander';
import { PasteEvent } from './paste.event';

export class PasteEventHandler extends EventHandler<PasteEvent> {
  handle(): void {
    this.flow.commandHandler.emit('paste');
  }
}
