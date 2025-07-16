import { FlowCore } from '../../flow-core';
import { __NEW__NEW__BaseInputEvent } from '../__new__input-events.interface';

export abstract class __NEW__EventHandler<TEvent extends __NEW__NEW__BaseInputEvent> {
  constructor(protected readonly flow: FlowCore) {}

  abstract handle(event: TEvent): void;
}
