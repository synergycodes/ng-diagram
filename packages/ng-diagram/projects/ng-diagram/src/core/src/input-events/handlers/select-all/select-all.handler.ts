import { EventHandler } from '../event-handler';
import { SelectAllEvent } from './select-all.event';

export class SelectAllEventHandler extends EventHandler<SelectAllEvent> {
  handle(): void {
    this.flow.commandHandler.emit('selectAll');
  }
}
