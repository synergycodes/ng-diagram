import { EventHandler } from '../event-hander';
import { PasteEvent } from './paste.event';

export class PasteEventHandler extends EventHandler<PasteEvent> {
  handle(event: PasteEvent): void {
    this.flow.commandHandler.emit('paste', this.getPasteParameters(event));
  }

  private getPasteParameters(event: PasteEvent) {
    if (!event.lastInputPoint) {
      return {};
    }

    return {
      position: this.flow.clientToFlowPosition(event.lastInputPoint),
    };
  }
}
