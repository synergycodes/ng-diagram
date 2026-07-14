import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../input-events.interface';

export abstract class EventHandler<TEvent extends BaseInputEvent> {
  constructor(protected readonly flow: FlowCore) {}

  abstract handle(event: TEvent): void | Promise<void>;

  /**
   * Aborts the gesture this handler is currently tracking, without the side
   * effects of a normal `end` phase (no edge creation, no group drop, …).
   *
   * Gesture handlers override this to clear their action state, reset internal
   * tracking and let the corresponding "ended" event fire with a cancel reason.
   * The default is a no-op for handlers without an in-progress gesture concept.
   */
  cancel(): void | Promise<void> {
    // No-op by default.
  }
}
