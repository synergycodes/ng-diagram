import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

export class UndoEventHandler extends EventHandler<BaseInputEvent> {
  //TODO: To implement
  handle(): void {
    this.flow.model.undo();
  }
}
