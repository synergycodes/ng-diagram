import { EventHandler } from '../event-handler';
import { CopyInputEvent } from './copy.event';

export class CopyEventHandler extends EventHandler<CopyInputEvent> {
  handle(): void {
    this.flow.commandHandler.emit('copy');
  }
}
