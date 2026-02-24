import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface SelectEvent extends BasePointerInputEvent {
  name: 'select';
  phase?: InputEventPhase;
}
