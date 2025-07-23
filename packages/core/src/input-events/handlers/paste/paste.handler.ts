import { EventHandler } from '../event-hander';
import { PasteEvent } from './paste.event';

export class PasteEventHandler extends EventHandler<PasteEvent> {
  handle(event: PasteEvent): void {
    this.flow.commandHandler.emit('paste', event.lastInputPoint ? { position: event.lastInputPoint } : {});
  }
}
