import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../input-events.interface';

export abstract class EventHandler<TEvent extends BaseInputEvent> {
  constructor(protected readonly flow: FlowCore) {}

  /**
   * Invoked by the router WITHOUT awaiting: a new call may begin while a
   * previous one is suspended at an await. Async handlers must commit instance
   * state before their first suspension point and re-validate gesture liveness
   * after resuming (see pointer-move-selection).
   */
  abstract handle(event: TEvent): void | Promise<void>;
}
