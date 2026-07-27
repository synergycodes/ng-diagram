import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../input-events.interface';

export abstract class EventHandler<TEvent extends BaseInputEvent> {
  constructor(protected readonly flow: FlowCore) {}

  abstract handle(event: TEvent): void | Promise<void>;
}
