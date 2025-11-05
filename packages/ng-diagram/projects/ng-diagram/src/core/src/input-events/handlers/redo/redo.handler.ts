import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

export class RedoEventHandler extends EventHandler<BaseInputEvent> {
  //TODO: To implement
  handle(): void {
    this.flow.model.redo();
  }
}
