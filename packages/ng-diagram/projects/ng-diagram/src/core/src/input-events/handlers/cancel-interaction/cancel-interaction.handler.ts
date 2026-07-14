import { BaseInputEvent } from '../../input-events.interface';
import { EventHandler } from '../event-handler';

/**
 * Aborts whatever interactive gesture is currently in progress
 * (linking, dragging, resizing, rotating, panning).
 *
 * Bound to the `cancelInteraction` shortcut action (Escape by default) and
 * reachable programmatically via `NgDiagramService.cancelActiveInteraction()`.
 * No-op when nothing is active.
 */
export class CancelInteractionEventHandler extends EventHandler<BaseInputEvent> {
  async handle(): Promise<void> {
    await this.flow.cancelActiveInteraction();
  }
}
