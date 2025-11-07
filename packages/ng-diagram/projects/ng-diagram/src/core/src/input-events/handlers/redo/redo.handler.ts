import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

export class RedoEventHandler extends EventHandler<BaseInputEvent> {
  /**
   * Handles redo input events.
   *
   * @todo Implement full redo event handling logic.
   */
  handle(): void {
    this.flow.model.redo();
  }
}
