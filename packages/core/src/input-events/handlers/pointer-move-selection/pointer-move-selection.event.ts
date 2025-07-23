import { BasePointerInputEvent, InputEventPhase } from '../../input-events.interface';

export interface PointerMoveSelectionEvent extends BasePointerInputEvent {
  name: 'pointerMoveSelection';
  phase: InputEventPhase;
}
