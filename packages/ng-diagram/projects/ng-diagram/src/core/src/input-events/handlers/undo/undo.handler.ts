import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

export class UndoEventHandler extends EventHandler<BaseInputEvent> {
  /**
   * Handles undo input events.
   *
   * @todo Implement full undo event handling logic.
   */
  handle(): void {
    this.flow.model.undo();
  }
}
