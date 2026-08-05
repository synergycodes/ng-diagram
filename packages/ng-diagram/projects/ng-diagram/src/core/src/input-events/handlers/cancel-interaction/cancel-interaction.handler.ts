import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

/**
 * Aborts whatever interactive gesture is currently in progress
 * (linking, dragging, resizing, rotating, panning).
 */
export class CancelInteractionEventHandler extends EventHandler<BaseInputEvent> {
  async handle(): Promise<void> {
    await this.flow.cancelActiveInteraction();
  }
}
