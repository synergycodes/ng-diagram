import { EventHandler } from '../event-hander';
import { DeleteSelectionEvent } from './delete-selection.event';

export class DeleteSelectionEventHandler extends EventHandler<DeleteSelectionEvent> {
  handle(): void {
    this.flow.commandHandler.emit('deleteSelection');
  }
}
