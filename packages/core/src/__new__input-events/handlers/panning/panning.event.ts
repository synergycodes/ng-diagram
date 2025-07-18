import { BasePointerInputEvent, InputEventPhase } from '../../__new__input-events.interface';

export interface __NEW__PanningEvent extends BasePointerInputEvent {
  name: 'panning';
  phase: InputEventPhase;
}
