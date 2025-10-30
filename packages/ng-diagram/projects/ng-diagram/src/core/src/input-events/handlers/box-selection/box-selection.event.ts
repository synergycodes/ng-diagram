import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface BoxSelectionEvent extends BasePointerInputEvent {
  name: 'boxSelection';
  phase: InputEventPhase;
}
