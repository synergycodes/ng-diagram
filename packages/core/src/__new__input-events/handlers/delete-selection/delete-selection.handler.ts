import { __NEW__EventHandler } from '../event-hander';
import { __NEW__DeleteSelectionEvent } from './delete-selection.event';

export class __NEW__DeleteSelectionEventHandler extends __NEW__EventHandler<__NEW__DeleteSelectionEvent> {
  handle(): void {
    this.flow.commandHandler.emit('deleteSelection');
  }
}
