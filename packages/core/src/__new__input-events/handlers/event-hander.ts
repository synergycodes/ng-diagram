import { FlowCore } from '../../flow-core';
import { BaseInputEvent } from '../__new__input-events.interface';

export abstract class __NEW__EventHandler<TEvent extends BaseInputEvent> {
  constructor(protected readonly flow: FlowCore) {}

  abstract handle(event: TEvent): void;
}
