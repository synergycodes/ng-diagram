import { BasePointerInputEvent, InputEventPhase } from '../../__new__input-events.interface';

export interface LinkingInputEvent extends BasePointerInputEvent {
  name: 'linking';
  phase: InputEventPhase;
  portId: string;
}
