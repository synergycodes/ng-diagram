import { __NEW__EventHandler } from '../event-hander';
import { __NEW__PasteEvent } from './paste.event';

export class __NEW__PasteEventHandler extends __NEW__EventHandler<__NEW__PasteEvent> {
  handle(): void {
    this.flow.commandHandler.emit('paste');
  }
}
