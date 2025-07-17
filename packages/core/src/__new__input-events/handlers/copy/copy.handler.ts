import { __NEW__EventHandler } from '../event-hander';
import { __NEW__CopyEvent } from './copy.event';

export class CopyEventHandler extends __NEW__EventHandler<__NEW__CopyEvent> {
  handle(): void {
    this.flow.commandHandler.emit('copy');
  }
}
