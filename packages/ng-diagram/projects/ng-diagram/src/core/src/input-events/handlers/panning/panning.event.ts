import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface PanningEvent extends BasePointerInputEvent {
  name: 'panning';
  phase: InputEventPhase;
}
